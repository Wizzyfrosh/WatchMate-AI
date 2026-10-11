# WatchMate AI — Infrastructure & Operational Runbook

This directory contains the AWS SAM / CloudFormation specification (`template.yaml`) for deploying WatchMate AI's hosted backend, media storage, and CDN.

---

## 1. Architecture Overview

- **AWS API Gateway (HTTP API)**: Low-latency REST routing with 16 KB request limit, CORS, and correlation ID support.
- **AWS Lambda**: Node.js 20.x ARM64 execution running Fastify with the AWS Lambda adapter.
- **Amazon Bedrock**: Serverless generative AI (`amazon.nova-lite-v1:0` or `anthropic.claude-3-haiku-20240307-v1:0`) invoked via Converse API within strictly scoped IAM policies.
- **Amazon DynamoDB**:
  - `watchmate-sessions`: Session authentication, judge evaluation access code exchange, and short-lived tokens with TTL expiration.
  - `watchmate-quotas`: Atomic rate limits (6 requests/min/session, 30 requests/day/session, and global ceiling).
- **Amazon S3 & CloudFront**: Encrypted private media bucket with CloudFront Origin Access Control (OAC) for HTTPS streaming of educational videos and WebVTT captions.

---

## 2. Security Boundaries & Guardrails

1. **Zero Secrets in Client**: The Fire TV / Android TV APK contains no AWS credentials, long-lived access keys, or administrative tokens.
2. **Judge Evaluation Code Exchange**:
   - Judges receive an evaluation code in submission instructions.
   - The TV client exchanges the code via `POST /v1/auth/exchange` for an ephemeral, scoped session token (12-hour TTL).
   - Only hashed access codes are stored in DynamoDB.
3. **Atomic Quota Enforcement**:
   - Every AI request atomically increments rate counters in DynamoDB.
   - If per-minute or daily thresholds are reached, API returns HTTP 429 with retry guidance.
4. **Runtime AI Kill Switch**:
   - If spending thresholds are reached or service needs maintenance, set `AI_KILL_SWITCH=true`.
   - The backend immediately returns HTTP 503 (`AI_SERVICE_DISABLED`) for AI endpoints while preserving catalog browsing and video playback completely.
5. **Safe Operational Logging**:
   - Logs timestamp, correlationId, hashed sessionId, modelId, durationMs, and token count.
   - Request bodies, full transcripts, and viewer personal data are NEVER logged.

---

## 3. Deployment Commands

### Prerequisites
- AWS CLI configured with authorized IAM credentials.
- AWS SAM CLI installed.

### Build and Package
```bash
cd infra
sam build
```

### Deploy to Staging
```bash
sam deploy \
  --stack-name watchmate-staging \
  --parameter-overrides Environment=staging BedrockModelId=amazon.nova-lite-v1:0 AiKillSwitch=false \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM
```

### Emergency Rollback
To immediately disable AI generation without tearing down infrastructure:
```bash
sam deploy \
  --stack-name watchmate-staging \
  --parameter-overrides AiKillSwitch=true \
  --no-confirm-changeset
```

To roll back to a previous stack version:
```bash
aws cloudformation rollback-stack --stack-name watchmate-staging
```
