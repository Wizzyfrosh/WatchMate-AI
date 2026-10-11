# Operations Runbook — WatchMate AI

## 1. Architecture Summary

```
Fire TV APK
   │
   ├── GET /v1/videos          ← Public (no auth)
   ├── GET /v1/videos/:id      ← Public
   ├── GET /health              ← Public
   │
   ├── POST /v1/auth/exchange   ← Public (code → session token)
   ├── POST /v1/assist          ← Auth + Quota enforced
   └── POST /v1/quizzes         ← Auth + Quota enforced
         │
   API Gateway (HTTP API, 16 KB body limit)
         │
   Lambda (Node 20.x ARM64, Fastify)
         │
   ├── DynamoDB Sessions (TTL-based)
   ├── DynamoDB Quotas (atomic counters)
   └── Bedrock Converse API
         │
   S3 (private) → CloudFront OAC → HTTPS Media/Captions
```

## 2. Session Lifecycle

1. **Judge receives evaluation access code** in submission instructions.
2. TV client sends `POST /v1/auth/exchange { accessCode: "..." }`.
3. Server verifies SHA-256 hash against `EVAL_CODE_HASH` parameter.
4. On match: creates DynamoDB session record with **12-hour TTL**.
5. Returns `{ token: "sess-...", expiresAt: <epochMs> }`.
6. Client sends `Authorization: Bearer sess-...` on all AI requests.
7. Expired sessions are rejected at auth time. DynamoDB TTL handles background cleanup.

**Revocation**: Delete the session record from DynamoDB Sessions table, or rotate `EVAL_CODE_HASH` to prevent new exchanges.

## 3. Quota Enforcement

| Limit | Scope | Enforcement |
|---|---|---|
| 6 requests/minute | Per session | DynamoDB atomic `ADD` + `ConditionExpression` |
| 30 requests/day | Per session | DynamoDB atomic `ADD` + `ConditionExpression` |
| Global kill switch | All sessions | Environment variable `AI_KILL_SWITCH=true` |

**Key property**: Each quota check is a single atomic DynamoDB operation. Concurrent Lambda invocations cannot bypass the limit because DynamoDB's conditional writes are serialized at the item level.

**Response codes**:
- `429 Too Many Requests` with `Retry-After` header for rate limits.
- `503 AI_SERVICE_DISABLED` for kill switch activation.

## 4. AI Kill Switch

### When to Activate
- Unexpected cost spike detected.
- Model returning poor or harmful results.
- Service maintenance required.
- Approaching budget ceiling.

### How to Activate (Immediate)

**Option A — SAM parameter update** (recommended for persistent change):
```bash
sam deploy \
  --stack-name watchmate-staging \
  --parameter-overrides AiKillSwitch=true \
  --no-confirm-changeset
```

**Option B — Lambda env var update** (faster, temporary):
```bash
aws lambda update-function-configuration \
  --function-name WatchMateApiFunction \
  --environment "Variables={AI_KILL_SWITCH=true}"
```

### Effect
- All AI endpoints (`/v1/assist`, `/v1/quizzes`) return `503 AI_SERVICE_DISABLED`.
- Catalog browsing, video playback, and auth exchange continue working normally.
- No user data is affected. Sessions remain valid.

### How to Deactivate
Set `AiKillSwitch=false` via SAM deploy or Lambda env var update.

## 5. Safe Operational Logging

### What IS logged (CloudWatch)
- `timestamp` — ISO-8601 UTC
- `correlationId` — Request correlation UUID
- `sessionIdHash` — SHA-256 truncated to 16 hex chars
- `action` — "assist", "quiz", "session_rejected", "kill_switch_block", "quota_exceeded"
- `status` — "success", "error", "rate_limited", "disabled"
- `statusCode` — HTTP status
- `durationMs` — Request processing time
- `tokensUsed` — Bedrock token count (when available)

### What is NEVER logged
- Request bodies
- Transcript text or segment content
- Full session IDs (only truncated hashes)
- Viewer personal data
- AWS credentials or access codes

## 6. Deployment

### Prerequisites
- AWS CLI configured with authorized IAM credentials
- AWS SAM CLI v1.100+ installed
- Node.js 20.x for Lambda build

### Build
```bash
cd services/api && npm run build && cd ../../infra
sam build
```

### Deploy to Staging
```bash
sam deploy \
  --stack-name watchmate-staging \
  --parameter-overrides \
    Environment=staging \
    BedrockModelId=amazon.nova-lite-v1:0 \
    AiKillSwitch=false \
    EvaluationAccessCodeHash=<SHA256_OF_ACCESS_CODE> \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM
```

### Upload Media Assets
```bash
aws s3 sync content/ s3://watchmate-media-staging-<ACCOUNT_ID>/ \
  --exclude "*.json" \
  --include "*.mp4" \
  --include "*.vtt"
```

## 7. Rollback Procedures

### Rollback to Previous Stack Version
```bash
aws cloudformation rollback-stack --stack-name watchmate-staging
```

### Emergency: Disable AI Only
See Section 4 (Kill Switch). This preserves all other functionality.

### Full Service Shutdown
```bash
aws cloudformation delete-stack --stack-name watchmate-staging
```
⚠️ This deletes all resources including DynamoDB tables. Use only as last resort.

## 8. Cost Monitoring

### Billable Actions
| Resource | Cost Driver |
|---|---|
| Bedrock Converse | Input/output tokens per invocation |
| DynamoDB | Read/write request units |
| Lambda | Invocation count × duration |
| CloudFront | Data transfer out |
| S3 | Storage + GET requests |

### Budget Protection
1. **Quota limits** prevent runaway usage per session.
2. **Kill switch** provides instant generation cost stop.
3. Set AWS Budgets alarm for the deployment account.
4. Review CloudWatch Logs for `tokensUsed` trends.

## 9. Troubleshooting

| Symptom | Check | Action |
|---|---|---|
| All AI requests fail | Check `AI_KILL_SWITCH` Lambda env | Set to `false` if unintended |
| 401 on valid token | Check DynamoDB Sessions table TTL | Verify session hasn't expired |
| 429 but low usage | Check DynamoDB Quotas table counters | Verify TTL is cleaning old windows |
| High latency | Check Lambda cold starts | Increase `MemorySize` or enable Provisioned Concurrency |
| Model errors (502) | Check Bedrock model availability | Verify `BedrockModelId` is valid in the region |
