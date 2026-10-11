# Testing Guide — WatchMate AI

## 1. Local Development Testing

### Prerequisites
```bash
node --version   # v20.x or v24.x
npm --version    # 9.x+
```

### Install Dependencies
```bash
# From project root
cd packages/contracts && npm install && npm run build
cd ../../services/api && npm install
```

### Run All Backend Tests
```bash
cd services/api
npm run build
npm test
```

**Expected output**: All tests pass across 6 suites:
- `api.test.ts` — Core API route integration tests
- `bedrock.test.ts` — Bedrock adapter and output validation
- `eval-suite.test.ts` — 20-case grounding and boundary evaluation
- `g5-hosted.test.ts` — Session auth, quota, kill switch, and logging

### Run TV App Tests
```bash
cd apps/tv
npm test
npm run typecheck
```

### Full Phase Verification
```bash
node scripts/check-phase5.mjs
```

## 2. Evaluation Access (Judge Testing)

### Step 1: Obtain Session Token
```bash
curl -X POST https://<API_URL>/v1/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{"accessCode": "<EVALUATION_CODE>"}'
```

Response:
```json
{
  "status": "ok",
  "token": "sess-<UUID>",
  "expiresAt": 1729699200000
}
```

### Step 2: Use Token for AI Requests
```bash
# Explain request
curl -X POST https://<API_URL>/v1/assist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sess-<UUID>" \
  -d '{
    "requestId": "req-1",
    "videoId": "lesson-01",
    "transcriptVersion": "v1",
    "action": "explain",
    "detail": "standard",
    "playheadMs": 30000,
    "watchedRanges": [[0, 30000]]
  }'

# Quiz request
curl -X POST https://<API_URL>/v1/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sess-<UUID>" \
  -d '{
    "requestId": "quiz-1",
    "videoId": "lesson-01",
    "transcriptVersion": "v1",
    "playheadMs": 60000,
    "watchedRanges": [[0, 60000]]
  }'
```

### Session Limits
- **Duration**: 12 hours from exchange
- **Rate limit**: 6 AI requests per minute
- **Daily limit**: 30 AI requests per day
- **No limit** on catalog browsing or video playback

## 3. Error Scenarios to Verify

| Scenario | Expected Result |
|---|---|
| No `Authorization` header on AI endpoint | 401 `UNAUTHORIZED` |
| Expired session token | 401 `SESSION_EXPIRED` |
| Invalid access code | 401 `INVALID_ACCESS_CODE` |
| 7th request within 1 minute | 429 `TOO_MANY_REQUESTS` with `Retry-After` |
| 31st request in a day | 429 `TOO_MANY_REQUESTS` (DAILY_LIMIT) |
| AI kill switch active | 503 `AI_SERVICE_DISABLED` |
| Unknown video ID | 404 `VIDEO_NOT_FOUND` |
| Transcript version mismatch | 409 `CONTENT_VERSION_CONFLICT` |
| Request body > 16 KB | 413 `PAYLOAD_TOO_LARGE` |
| Model timeout | 504 `GENERATION_TIMEOUT` |
| Invalid model output | 502 `INVALID_MODEL_OUTPUT` |

## 4. Staging Verification Checklist

- [ ] `sam deploy` completes without errors
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] `GET /v1/videos` returns 3-lesson catalog
- [ ] Auth exchange succeeds with valid code
- [ ] Auth exchange fails with invalid code (401)
- [ ] Explain request succeeds with valid token
- [ ] Explain request fails without token (401)
- [ ] Rate limit triggers after 6 rapid requests (429)
- [ ] Kill switch blocks AI but preserves catalog
- [ ] CloudFront serves media files over HTTPS
- [ ] CloudWatch Logs show structured JSON without sensitive data

## 5. TV App Testing (Android TV Emulator)

### D-Pad Navigation
1. Launch app → Catalog screen visible
2. D-pad Up/Down moves focus between rows
3. D-pad Left/Right moves focus between cards
4. Select opens player
5. Back returns to catalog

### Playback
1. Video plays with captions
2. Pause/Play toggles correctly
3. Seek ±5s works
4. Progress bar updates

### WatchMate AI Flow
1. Open WatchMate panel after watching ≥15 seconds
2. Select "Explain" → explanation with source links appears
3. Select "Replay" → video seeks to source timestamp
4. Select "Catch Up" → chronological summary appears
5. Select "Quiz" → 3 questions with answer feedback
6. Incorrect answer → "Review" replays relevant section
