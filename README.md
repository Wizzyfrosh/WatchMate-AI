# WatchMate AI — Fire TV Learning Companion

> **Active AI-Powered Video Learning Companion for Amazon Fire TV**  
> *Built for the Amazon Developer Hackathon 2026*  
> **Evaluation Access Code:** `WATCHMATE-JUDGE-2026`  

---

## Overview

**WatchMate AI** transforms passive educational video streaming on Amazon Fire TV into an interactive, active learning experience. Designed specifically for 10-foot television viewing with remote control D-pad navigation, WatchMate AI enables students to:

1. **Ask for Grounded Explanations:** Pause at any confusing moment to receive explanations strictly grounded in the video segments watched so far (no hallucinations, no spoilers).
2. **Switch Detail Modes:** Toggle between **Standard** academic depth and **Simpler** conversational clarity.
3. **Catch-Up Summaries:** Request quick refresher summaries of preceding topics after stepping away or resuming.
4. **Interactive 3-Question Quizzes:** Test comprehension with multiple-choice questions derived directly from watched evidence.
5. **Direct Remediation Replay:** Selecting an incorrect quiz answer provides an immediate "Replay relevant section" button that seeks the video directly to the exact source timestamp to review the concept.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Amazon Fire TV Client                           │
│     (React Native / React Native TV — 1920x1080 10-Foot UI)            │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ 58% Video Canvas      │  │ 38% ActionPanel Overlay                │ │
│  │ - Video Player        │  │ - Explain (Standard / Simpler)         │ │
│  │ - Watched Tracker     │  │ - Catch-Up Summary                     │ │
│  │ - WebVTT Captions     │  │ - 3-Question Interactive Quiz          │ │
│  │ - D-Pad Navigation    │  │ - Wrong Answer Remediation Seek        │ │
│  └───────────────────────┘  └────────────────────────────────────────┘ │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS / Bearer Session Token
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend API Service                             │
│     (Fastify / TypeScript — Local Server or AWS Lambda HTTP API)       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: Auth Exchange, Quota Guard, AI Kill Switch, Logs    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│    │                        │                               │          │
│    ▼                        ▼                               ▼          │
│ ┌──────────────┐   ┌────────────────────────┐   ┌────────────────────┐ │
│ │  Amazon S3   │   │  AWS Bedrock Runtime   │   │   AWS DynamoDB     │ │
│ │ & CloudFront │   │  - Claude 3 Haiku      │   │ - Session Store    │ │
│ │ (Media/VTT)  │   │  - Converse API        │   │ - Atomic Quotas    │ │
│ └──────────────┘   │  - JSON Structured Out │   │   (6/min, 30/day)  │ │
│                    └────────────────────────┘   └────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Layout

```
WatchMateAI/
├── apps/
│   └── tv/                  # Fire TV application (React Native for TV, Jest, TypeScript)
├── packages/
│   └── contracts/           # Shared Zod schemas, evidence normalizer, API contracts
├── services/
│   └── api/                 # Fastify / AWS Lambda backend, Bedrock Converse integration
├── content/                 # Curated educational videos, timestamped transcripts, WebVTT
│   ├── catalog.json         # 3 approved science & nature lessons
│   ├── transcripts/         # Timestamped monotonic transcript segments
│   ├── captions/            # WebVTT subtitle files
│   └── rights/              # Educational rights & attribution metadata
├── infra/                   # AWS SAM / CloudFormation deployment templates
│   ├── template.yaml        # API Gateway, Lambda, DynamoDB, S3, CloudFront
│   └── README.md            # Infrastructure deployment and rollback runbook
├── scripts/                 # Verification and measurement scripts (Phase 1 to 6)
└── docs/                    # PRD, execution plan, operations manual, testing guides
```

---

## Quickstart & Clean-Checkout Reproduction

### Prerequisites
- **Node.js:** v20.x or v24.x LTS
- **npm:** v10.x or v11.x
- **OS:** Windows 11, macOS, or Linux

### 1. Build & Test Shared Contracts
```bash
cd packages/contracts
npm install
npm run build
npm test
```
*Expected output: 21 passing tests across 5 suites.*

### 2. Validate Curated Content Package
```bash
# From workspace root:
node content/validate.mjs
```
*Expected output: 3 approved lessons validated with monotonic transcripts and WebVTT captions.*

### 3. Build & Test Backend API
```bash
cd services/api
npm install
npm run build
npm test
```
*Expected output: 87 passing tests across 13 suites, including the 20-case grounding evaluation suite and 10 consecutive full user journeys.*

### 4. Run TV Client Tests & Android Bundle
```bash
cd apps/tv
npm install
npm test
npm run typecheck
npm run bundle:android -- --max-workers 2
```
*Expected output: 20 passing Jest tests, zero TypeScript errors, valid Metro production bundle.*

### 5. Execute Comprehensive Phase Verification
From the repository root, run the gate verification scripts:
```bash
node scripts/check-phase1.mjs   # Contracts & Content
node scripts/check-phase2.mjs   # TV Player & UI
node scripts/check-phase3.mjs   # Bedrock Integration & Explain
node scripts/check-phase4.mjs   # Catch-Up, Quiz & 20-Case Eval Set
node scripts/check-phase5.mjs   # Hosted Infrastructure, Auth & Quotas
node scripts/check-phase6.mjs   # Release Candidate Regression & Profiling
```

---

## Evaluation Access for Hackathon Judges

To evaluate WatchMate AI without configuring AWS IAM credentials:

1. **Start the local backend:**
   ```bash
   cd services/api
   npm start
   ```
   *The server starts on `http://127.0.0.1:3000` with the local mock AI provider enabled by default.*

2. **Authenticate with the Judge Access Code:**
   ```bash
   curl -X POST http://127.0.0.1:3000/v1/auth/exchange \
     -H "Content-Type: application/json" \
     -d '{"accessCode": "WATCHMATE-JUDGE-2026"}'
   ```
   *Response returns a cryptographically secure session token.*

3. **Interact with AI endpoints:**
   Use the returned session token in the `Authorization: Bearer <token>` header to make requests to `/v1/assist` and `/v1/quizzes`.

---

## Security, Privacy & Quota Protections

- **Zero Client-Side Credentials:** The TV application holds no AWS access keys, secret keys, or Bedrock credentials. All AI calls route through the secured backend API.
- **Strict Evidence Guardrails:** The backend clamps student queries to strictly watched video intervals. Straddling or future segments are excluded, preventing spoilers and out-of-bounds hallucinations.
- **Atomic Quota Enforcement:** DynamoDB conditional updates strictly enforce rate limits (6 requests/minute and 30 requests/day per session) to prevent runaway cloud costs.
- **AI Kill Switch:** Setting `AI_KILL_SWITCH=true` disables generative endpoints immediately (HTTP 503) while preserving video browsing and playback completely intact.
- **Operational Privacy:** Operational logs record truncated SHA-256 session hashes (16 hex chars). Student queries, raw video text, and PII are never logged.

---

## Project Verification Gates (G0–G7)

| Gate | Description | Status | Evidence |
| :---: | :--- | :---: | :--- |
| **G0** | Fire TV D-pad Playback & Native APK | *Pending* | Awaiting native emulator run (`npm run android`) |
| **G1** | Contracts, Routes & Curated Content | **PASS** | 21 contract tests, content validator |
| **G2** | Video Player, 10-ft UI & Captions | **PASS** | 20 TV tests, Metro bundle clean |
| **G3** | Bedrock Integration & Grounded Explain | **PASS** | Output validator, 11 Bedrock tests |
| **G4** | Catch-Up, 3-Q Quiz & 20-Case Eval Set | **PASS** | 20 grounding eval cases pass |
| **G5** | SAM Template, DynamoDB Auth & Quotas | **PASS** | 24 hosted reliability tests, SAM template |
| **G6** | Release Candidate & 10 User Journeys | **PASS** | 10/10 rehearsal journeys, benchmark profiling |
| **G7** | Submission Package & Video Recording | *Next* | Final submission package & Devpost assets |

---

## License & Attribution

Curated educational video materials and transcripts are adapted from open educational resources with monotonic time alignment. Full rights and attribution records are maintained in [`assets/ATTRIBUTION.md`](file:///c:/Users/user/Desktop/WatchMate%20AI/WatchMateAI/assets/ATTRIBUTION.md).
