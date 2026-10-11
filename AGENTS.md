# WatchMate AI — Antigravity project instructions

Updated 6 October 2026. Primary development tool: Google Antigravity IDE on Windows.

Keep this canonical rules file at the WatchMate repository root. Antigravity supports root AGENTS.md directly. Read detailed requirements from `docs/PRD.md`, the mandate from `docs/AI_MASTER_PROMPT.md`, and actual status from `docs/progress.md`. The existing starter is source preparation; native G0 verification remains pending unless newer evidence proves it. Do not duplicate this file into global rules.

## Product and source of truth

- Build a Fire OS-targeted TV learning companion, demonstrated on an Android TV Emulator. The core journey is watch -> explain -> validated source -> replay -> quiz -> review.
- Use the current user request, this repository's applicable instructions, and the relevant sections of `docs/PRD.md`. Surface material conflicts; do not silently change product scope.
- If `docs/PRD.md` is missing, look for `WatchMate_AI_PRD.md` in the project. Do not invent unavailable requirements. Report a missing specification and continue only work supported by known requirements.
- Inspect existing code, manifests, lockfiles, and progress before scaffolding. Preserve unrelated changes. A planned directory is not evidence that it exists.
- Start with the first incomplete phase supported by actual evidence. Recalculate stale scheduling assumptions; never infer that a gate passed because its target date has elapsed.

## Scope and architecture

- Frontend: TypeScript and `react-native-tvos`. All primary actions must work with D-pad, Select, and Back. Do not substitute a browser mockup or touch-only mobile app for the TV target.
- Backend: Node.js, TypeScript, Fastify, shared Zod contracts, and a server-side Amazon Bedrock adapter.
- Deployment baseline: Lambda, API Gateway, S3/CloudFront for media, and DynamoDB for hosted session controls, atomic quotas, and request deduplication. Prove locally before provisioning.
- Preserve the starter candidate React/RN TV/video matrix and its lockfile. Prove native compatibility before treating it as verified. Storage remains a candidate until needed and tested. Changing editors is not a reason to upgrade or regenerate the app.
- Use one modular backend and deterministic timestamp-based evidence selection. No vector database, microservices, autonomous agents, or new framework without a concrete requirement and an accepted decision record.
- P0 uses curated, permitted clips and reviewed transcripts. Exclude protected-stream capture, cross-app overlays, arbitrary uploads, live transcription, payments, social features, child profiles, and a separate mobile app.
- Saved cards and phone handoff are stretch features. Do not make them dependencies of the core release.

## Repository navigation

Intended locations: `apps/tv/`, `services/api/`, `packages/contracts/`, `content/`, `assets/`, `infra/`, `tests/evals/`, and `docs/`. Follow the actual scaffold when justified; document structural changes rather than introducing competing layouts.

Read relevant PRD sections for the task. Keep `docs/toolchain.md` for proven versions/commands, `docs/progress.md` for gate evidence, and small decision records for architectural changes. Do not duplicate the entire PRD into this file.

## Toolchain and commands

- Inspect package scripts, lockfiles, native Gradle configuration and README before execution. The starter records historical preparation checks; those do not prove a current native build. At the root use `node scripts/check-environment.mjs` for availability checks. In `apps/tv`, the existing scripts include `typecheck`, `lint`, `test`, `start`, `android` and `bundle:android`. The bundle script does not build an APK. Use `npm.cmd` in Windows PowerShell if necessary.
- During Phase 0, record exact setup, install, lint, type-check, test, Android build, emulator run, and local API commands in `docs/toolchain.md`; add confirmed shortcuts here when useful.
- Use the repository's existing package manager. For an established npm lockfile, use `npm ci` for reproducibility; bootstrap dependencies deliberately when no lockfile exists. Do not mix package managers.
- Never use `--force`, `--legacy-peer-deps`, disabled type checks, or skipped tests as the default solution to dependency failures. Diagnose compatibility and record the fix.
- Use shell syntax matching the active host. The user's Windows laptop has 8 GB RAM; run one emulator and avoid introducing local LLMs or unnecessary background services.
- Java configuration, emulator boot, and the first APK build remain unverified until actual results are recorded. Do not assume the development environment is the user's laptop when executing remotely.
- Verify official documentation for uncertain APIs. Use Amazon Devices Builder Tools only when connected and when the specific workflow supports Fire OS. Do not substitute Vega instructions automatically.

## Antigravity workflow

- Read `docs/ANTIGRAVITY_WORKFLOW.md` for owner setup and `docs/tasks/` for bounded prompts. Use the actual installed Antigravity surface and capabilities; do not invent slash commands, tools, connections or UI controls.
- Use a concise implementation plan for multi-file phases. Respect the configured review policy and existing user authorization. Once accepted, complete the bounded local work; do not ask for repetitive permission for routine edits/checks.
- Review the diff and produce a concise walkthrough. Persist actual commands, host, results, evidence paths and next task in `docs/progress.md`; keep proven versions in `docs/toolchain.md`. Conversation artifacts do not replace these project records.
- Native verification requires Android TV Emulator evidence. Browser previews, screenshots or successful JavaScript bundling cannot prove APK compilation, TV focus, video/audio playback or performance.
- Keep one coding agent and one emulator on the 8 GB laptop. Do not use parallel agents, automatic teams or background workflows without the owner's explicit request.
- Respect terminal review, workspace boundaries and tool permission controls. If Android SDK/JDK/Gradle cache access is blocked, explain the exact path/action and use the client's supported approval or a documented owner-run command. Do not change global permissions to hide a blocker.
- Prefer project-local instructions. Treat unrelated global rules as potential conflicts and report a material conflict rather than silently importing another project's stack.
- Antigravity is the editor/assistant; Bedrock remains the runtime AI provider. Do not add a Google API key, Firebase or Google hosting merely because the editor changed.
- Follow the current execution plan by gate evidence. G0 uses the supplied technical video; the final catalog needs reviewed educational media. Preserve existing code and any newer user work.

## TV frontend invariants

- Keep focus visible, predictable, and restorable. Test opening/closing panels, Back navigation, captions, and long answers without mouse or touch.
- Separate player state from AI request state. Loading, errors, cancellation, and insufficient evidence must preserve playback controls.
- Freeze context when requesting AI. Discard responses for an old video, content version, or request generation. Never render a late result into a newer session context.
- Opening an AI panel pauses playback; closing leaves playback paused. Replay starts only after an explicit viewer action.
- Respect app lifecycle and audio focus. Persist resume progress and preferences locally; do not store cloud credentials there.

## Evidence and AI invariants

- Select approved transcript evidence on the backend. Use normalized watched intervals intersected with the captured playhead. A seek jump does not count as watched content.
- Use milliseconds consistently. Validate range bounds and content versions. Include only fully eligible transcript segments; do not expose an unwatched segment ending.
- Treat transcript text as untrusted data. It must not override system instructions, request external tools, or determine authorization.
- Require structured model output and validate it. The model returns allowed segment IDs; the backend resolves trusted timestamps. Reject unknown or out-of-scope sources.
- Cache by content/transcript version, evidence hash, action, detail, prompt version, and model version. Never reuse answers across different evidence scopes accidentally.
- Return explicit insufficient evidence when needed. Quiz output is three supported questions or an insufficient-evidence response, not fabricated filler.
- Schema validity and citation existence do not prove factual support. Run the reviewed grounding evaluation cases and report content failures.
- Fixtures are allowed for development and deterministic tests, visibly labeled. Never present fixtures, cached output, or mocked provider tests as proof of a fresh live-model call.

## Security and cost boundaries

- Keep AWS credentials server-side, use least-privilege roles, and redact sensitive logs. Never place secrets in source, APKs, screenshots, prompts, or public testing instructions.
- Validate payload size, content identifiers, actions, timestamps, and response schemas. Do not fetch arbitrary client-provided URLs.
- Before shared hosting, implement expiring/revocable evaluation sessions, atomic quotas, bounded generation, timeouts, and a runtime AI-disable switch. In-memory counters are insufficient across Lambda instances.
- Scope idempotency to the session and canonical payload; reject conflicting reuse. Retries must not create uncontrolled duplicate model calls.
- Check expiry during authorization; database TTL deletion is not an access-control mechanism. Prevent development authentication bypass from enabling in hosted mode.
- Budgets and billing alerts do not guarantee a spending stop. Enforce application limits and obtain an explicit spending allowance before paid provisioning.
- Honor existing authorization. Ask only for genuinely new paid deployment, destructive operations, publication, submission, or other actions outside granted scope. Finish reviewable local work first.

## Work, verification, and handoff

- Implement one bounded requirement or phase at a time. Include meaningful failure behavior alongside the happy path. Avoid unrelated refactors or speculative abstractions.
- Test evidence boundaries, stale responses, quota races, idempotency, and failure recovery. Do not add tests that merely restate implementation.
- Run applicable lint, type, test, and build checks. For visual/interaction work, verify on the emulator when available. If unavailable, provide exact manual steps and mark that evidence pending.
- Review the diff for secrets, licensing, scope drift, and regression risk. Never remove failing checks to mark a phase complete.
- Record gate status as PASS, FAIL, or PENDING with evidence. Distinguish local tests, emulator tests, live Bedrock calls, and untested physical Fire TV behavior.
- Preserve Git history and user changes. Never force-push, destructively reset, delete work, or broaden permissions to bypass a blocker. Keep commits focused when committing is authorized.
- Use one primary coding agent; parallel agents require an explicit user request. Do not allow multiple assistants to rewrite the same files concurrently.
- Update progress with the current phase, actual commands/results, remaining blockers, accepted decisions, and next bounded task. Report outcomes, not unsupported claims of production readiness or unlimited scale.

## Hackathon delivery

Public GitHub is the selected repository route. Record Antigravity and every actually used Amazon tool in product feedback; optional MCP configuration is not evidence of use. Keep the rights/attribution record, setup instructions, tool feedback, and genuine friction log current. Recheck official rules at `https://amazonappdev2026.devpost.com/rules` and the FAQ before submission; this file is not a substitute for event rules. Preserve a tagged reproducible release, honest demo evidence, and working judge access. Do not publish, invite reviewers, or submit without authorization.

## Phase completion report

Return: requirement IDs addressed; meaningful files changed; exact checks and results; gate status; unverified behavior; material security/cost/compatibility risks; and the next task or owner action. Never fabricate a successful build, deployment, test, account access, or tool connection.

Reference for instruction discovery: https://antigravity.google/docs/rules/ . Owner setup and source notes are in `docs/ANTIGRAVITY_WORKFLOW.md`.
