# WatchMate AI — execution plan to submission

Prepared for Umanor Wisdom Chizoba • Updated 6 October 2026 • Antigravity edition • All working dates below use Africa/Lagos time.

**Priority:** Prove the native TV demo before extending the product. The planning baseline is substantial; implementation evidence remains the critical gap.

**Deadline:** 23 October 2026, 12:00 p.m. Pacific daylight time = **8:00 p.m. WAT**. Target submission: **21 October**. Reserve 22–23 October for recovery.

This is an execution addendum to the existing PRD and AGENTS.md, not a replacement specification. Dates are proposed work targets, not commitments or evidence of completion. It is included at `docs/execution-plan.md` in the revised starter. Read actual gate evidence before applying these targets.

## 1. What was recovered and what remains unverified

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| Devpost registration email, 25 September 2026, “Build, Ship, Shape: Amazon Developer Hackathon: You're Registered! 🎉” | Registration; deadline; working demo, public repository, video under three minutes, and tool feedback requested | A completed submission or app |
| `WatchMate_AI_PRD.md`, v1.1, updated 6 October | Detailed product, architecture, API contracts, FR01–FR12, H01–H07, G0–G7 | The file explicitly describes a proposed implementation baseline |
| Root `AGENTS.md`, updated 6 October | Current durable engineering instructions; Fire OS/Android TV emulator path; one coding agent | Installed dependencies, actual commands, or passed gates |
| `WatchMate_AI_Antigravity_Master_Prompt.md`, 6 October | Antigravity plan, implementation, review and evidence workflow | A passed implementation gate |
| Earlier setup observations | Windows 11; 8 GB RAM; HP Folio/i5 sixth generation; Android Studio installed; WHPX usable; Node 24.13.0 and npm 11.6.2 reported | Current JDK/Gradle alignment, TV emulator boot, video playback, screen-recording performance, or dependency compatibility |
| Phase 0 starter, created 1 October; inspected 6 October | TV source, Android shell, local technical video, lockfile and historical preparation-check notes exist | A verified Windows APK, emulator recording, live model call, public repository or deployment |

This migration preserves the starter application and updates the documentation for Antigravity. No new native build, emulator test, provisioning, publication, deployment or submission was performed. Any newer owner checkout takes precedence over the packaged source; merge documentation with a reviewed diff.

The earlier target dates have elapsed without native G0 proof. Start at the first **unverified** gate in the existing source. The suggested folder `C:\Users\user\Projects\WatchMateAI` is a setup location, not a verified laptop checkout.

## 2. Decisions carried forward

- **Target:** Fire OS app, demonstrated with the **Android TV Emulator**. The official FAQ explicitly accepts this without physical Fire TV hardware. Clearly label the test platform; emulator results do not establish physical-device performance. [S2]
- **Development:** Google Antigravity IDE, one active agent, root AGENTS.md, reviewed plans and durable progress notes. Use `docs/ANTIGRAVITY_WORKFLOW.md`.
- **TV client:** TypeScript plus `react-native-tvos`, native playback and D-pad/Select/Back. Preserve the starter's candidate React 19.1.0 / RN-TV 0.81.5-0 / video 6.19.3 lockfile; native compatibility remains pending. AsyncStorage is introduced only when needed.
- **Backend:** Node.js/TypeScript, Fastify, shared Zod contracts, one server-side Bedrock adapter. Planned hosting remains Lambda/API Gateway, S3/CloudFront, and DynamoDB for hosted session controls.
- **Core experience:** Watch → Explain → validated source → Replay → Quiz → source-based review. Include Simpler, Catch-up, captions, and local resume from the existing P0 scope.
- **Content:** Start with one permitted short educational clip and its reviewed, aligned transcript. Expand to the PRD's three clips only after G3.
- **Scope exclusions:** No Vega port, child profiles, cross-app overlays, protected-stream capture, live transcription, arbitrary uploads, vector database, autonomous agents, dashboard, or separate mobile app. Saved cards and phone handoff remain stretch work.
- **Repository:** The current request selects the **public GitHub** route. There is no need to reopen the old public/private decision.

Amazon's rules allow different frameworks for Fire TV; compatibility and running-demo evidence are central. SDKs, simulators, and samples are setup resources, not a requirement to adopt every listed SDK. Record exactly what was used. [S1, S3]

## 3. Risk-ranked delivery gaps

“Unverified” means evidence was not available for this review. It does not mean a task is known to be unfinished on the owner's machine.

| Rank | Deliverable at risk | Concrete dependency or gap | First action and completion evidence |
| --- | --- | --- | --- |
| 1 — Critical | Working TV demo and recording | No native G0 evidence, working APK or recording. A candidate dependency matrix exists; Java was previously unresolved. Current Android guidance lists 16 GB RAM for Studio + Emulator and a newer CPU baseline than the recorded laptop. | By 7 Oct: one TV screen, visible remote focus, local clip play/pause/seek, clean build log, and a short emulator recording with audio. Measure the actual machine. [S4] |
| 2 — Critical | WatchMate's real AI learning loop | No verified permitted media package, aligned transcript, selected accessible Bedrock model/region, or live Explain/Replay result. | By 8 Oct: first rights/transcript package and model-access check; by 13 Oct: a recorded real-model loop with validated citations. Fixtures never count as the live gate. |
| 3 — High | Reproducible public code | Starter source and lockfile are available; public repository URL and native build remain unverified. | Inspect the existing checkout first; track exact setup from day one. By 20 Oct: clean-checkout build succeeds. By 21 Oct: public URL, license, assets/attribution, release tag, APK and instructions verified. |
| 4 — High | A demo judges can reproduce | No deployed endpoint, evaluation-access flow, approved budget, or operational runbook located. | Prepare tested local code and reviewable infrastructure; settle budget before paid provisioning. By 18 Oct: release APK reaches the HTTPS backend; access and quota tests pass. |
| 5 — High | Product feedback grounded in experience | No completed feedback record located; setup details are easy to lose. | Start at the first build attempt. Record exact tool/version, task, results, onboarding, useful behavior, friction, and improvements. Finalize by 20 Oct. |
| 6 — High | Public demo video under three minutes | No footage or link located. Recording can compete with the emulator for laptop resources. | Test capture during G0. Rehearse by 19 Oct; finish a 2:45 cut by 20 Oct; verify the public link by 21 Oct. |

WHPX availability establishes acceleration capability, not adequate application performance. Run one emulator, close unnecessary applications, and test the emulator independently of a heavy IDE session when feasible. If two focused G0 sessions cannot produce usable playback and capture, investigate a stronger borrowed development machine or a suitable remote emulator environment. Preserve the simulator approach; do not switch to a browser mockup or assume a physical Fire TV purchase is needed. Any paid alternative needs a concrete cost proposal first.

## 4. Build sequence with hard exit gates

Daily availability is unconfirmed. The 6 October calendar below is aggressive and replaces the previous September and 1 October targets. Re-estimate from G0 and G3 results; the earlier 70-80-hour budget is obsolete. Prepare submission assets throughout development.

| Dates | Phase / dependency | Implementation work | Exit evidence |
| --- | --- | --- | --- |
| 6–7 Oct | **G0 — native feasibility**; existing source or inspected starter | Inventory tools and code; resolve JDK/Gradle; pin React/RN-TV/video combination; build one TV screen; play/pause/seek one local permitted video; test capture | `docs/toolchain.md`, actual build/install commands and logs, short remote-control recording, commit reference |
| 8 Oct | **G1 — contracts/content**; G0 | Shared Zod schemas; first catalog/transcript/rights entry; local Fastify health/catalog routes; lockfile and real scripts; `.env.example` without secrets | Invalid IDs/timestamps/content fail; valid catalog loads; clip and captions align; reproducible install |
| 9–10 Oct | **G2 — complete playback**; G1 | Home/details/player/actions; D-pad focus and Back restoration; captions; local resume/preferences; watched intervals; stale-request invalidation | Open/play/pause/seek/caption/exit/resume without mouse or touch; app background pauses; skipped time is not watched |
| 11–13 Oct | **G3 — real Explain and Replay**; G2 + permitted content + accessible model | Server evidence selection, Bedrock adapter, schema/source validation, Explain and Simpler, explicit replay, timeout/insufficient-evidence/error states | One clip completes the real loop; allowed sources only; replay matches source; future/skipped segments rejected; stale response discarded |
| 14–15 Oct | **G4 — complete learning loop**; G3 | Catch-up; three-question quiz or insufficient evidence; wrong-answer review/replay; remaining two permitted clips; 20-case evaluation set | All three clips pass the loop; grounded explanations and quiz feedback reviewed; P0 FR01–FR12 mapped to evidence |
| 16–18 Oct | **G5 — hosted reliability**; G4 + spending/access decisions | Expiring evaluation sessions, atomic DynamoDB quotas, idempotency, token limits, kill switch, safe logs, SAM/CloudFormation, HTTPS and media delivery | Release APK uses real backend; unauthorized/expired/over-quota requests fail; concurrent limits hold; rollback and recovery documented |
| 19–20 Oct | **G6 — release candidate**; G5 | Freeze features; clean-checkout build; remote/lifecycle/error regression; grounding review; latency/token measurement; full recording rehearsal | Ten consecutive journeys without crash/focus trap; setup reproducible; release APK and test report; limitations explicit |
| 21 Oct | **G7 — package and submit**; G6 | Final video, public repository, feedback, screenshots, testing instructions, release tag/checksum, submission text and all links | Package matches demonstrated release; public links work signed out; actual submission receipt retained after authorized submission |
| 22–23 Oct | **Contingency only** | Fix packaging/access/reproducibility failures; verify receipt and final links | Complete before 23 Oct, 8:00 p.m. WAT; no new features |

### Dependencies to clear early without expanding G0

1. **Source access now:** open the revised starter or newer actual checkout in Antigravity. Inspect it before changes. Do not regenerate the existing native shell or discard the lockfile.
2. **Content by G1:** owner selects/approves one self-authored or redistribution-permitted 2–5 minute clip. Record its source/owner, license/permission, attribution, checksum, transcript version, and aligned WebVTT. Complete the other two before G4.
3. **Accounts/model by 8 Oct:** check Amazon developer and AWS account access, candidate model/region, IAM permissions, and billing availability. After G0, make one bounded server-side live call only within an approved spend allowance; record actual model ID, region, token counts, latency, and validation result. Do not expose credentials in chat.
4. **Credits:** the resources offer a $150 request, subject to availability; the rules give 21 Oct at noon PT as the request cutoff. Apply early if wanted; no evidence of requested or granted credits was found. Credits are not the operating budget. [S1, S3]
5. **Budget before G5:** measure a representative call, estimate generation plus hosting/media cost, then get a spending ceiling and judge-access plan agreed. Prepare code and infrastructure locally before that decision.
6. **Feedback every session:** capture observations as they happen. No need to wait for the product to be complete.

If G0 or G3 misses its target, re-estimate immediately. Remove stretch work and visual embellishment first. The PRD labels three clips, Catch-up, and quiz as P0: dropping them requires an explicit scope decision. Do not quietly call a smaller product complete. Protect native playback, remote navigation, grounded Explain, source replay, real integration, and submission packaging.

## 5. First implementation task: prove G0

**Inputs:** current checkout or supplied starter, revised PRD/AGENTS.md, Windows laptop and the included technical test clip. That clip is sufficient for G0; educational content is required from G1. No cloud deployment is needed.

1. Read the checkout's instructions, progress, manifests, lockfile, native Gradle configuration, and existing changes. Reuse any verified commands and passed evidence.
2. Record Node/npm, Java/JDK, Gradle/AGP, Android SDK and emulator image, React/RN-TV, video/storage library versions, and package manager. Do not assume Node 24 or a sample's “latest” dependencies are compatible.
3. Align terminal and IDE Gradle JDK selection with the chosen AGP version; inspect the bundled Android Studio JDK rather than assuming Java is entirely absent. Android documents that terminal and IDE selection can differ. [S5]
4. Inspect and build the existing native playback screen. Make only changes needed to pass G0. Confirm TV launcher/manifest configuration and record the intended Fire OS/API compatibility target. Do not rely on unavailable Google Play services.
5. Boot one Android TV AVD. Install and launch the APK. Use only the remote controls to move focus, play, pause, seek, and go Back. Record a short clip with readable UI and working audio.
6. Save the exact commands, results, failure details, and recording location in `docs/toolchain.md` and `docs/progress.md`. Record PASS/FAIL/PENDING honestly. A screenshot or Metro startup alone cannot pass G0.

**PowerShell inventory to run in the real checkout, not this remote review workspace:**

```powershell
Get-Location
git status --short
node --version
npm --version
java -version
adb version
emulator -list-avds
```

These are proposed checks, not executed results. If a command is missing from PATH, locate the installed SDK/JDK tool before reinstalling. Use the repository's actual Gradle wrapper and documented build script once inspected; no WatchMate build command has been verified here.

**Bounded Antigravity task:** Use `docs/tasks/phase0.md` and the master prompt. The workflow is inspect -> concise plan -> authorized implementation -> actual checks -> diff/walkthrough -> recorded evidence.

> Read AGENTS.md, the current PRD, and existing gate evidence. Inspect and preserve the checkout. Execute only the incomplete portion of G0: verify the Windows toolchain, pin a compatible RN-TV/video baseline, and demonstrate local TV playback with D-pad/Select/Back plus a short emulator recording. Document exact commands and failures. Do not deploy cloud resources, expand AI features, force dependency resolution, or claim laptop tests from a remote build. Finish with gate status, evidence paths, blockers, and the next bounded task.

## 6. Resource shortlist and compatibility checks

| Resource | Intended use | Check before adopting |
| --- | --- | --- |
| [Official event Resources](https://amazonappdev2026.devpost.com/resources) | Entry point for track docs, tooling and samples | Use the Fire OS path, not a Vega-only workflow |
| [Amazon React Native Fire TV Hello World](https://github.com/AmazonAppDev/hello-world-fire-tv-react-native) | Small reference for booting and installing a TV app | Inspect dependency/Gradle age and license; prove compatibility before reusing code |
| [Amazon multi-TV app sample](https://github.com/AmazonAppDev/react-native-multi-tv-app-sample) | Reference for TV focus, catalog and playback; it includes an Android/Fire OS app | Its Expo/Yarn/multi-platform structure is a reference, not an automatic stack migration |
| [React Native TV repository](https://github.com/react-native-tvos/react-native-tvos) | TV framework and focus guidance | Select a compatible React/RN-TV/native-module matrix and retain one lockfile |
| [Android Studio JDK guidance](https://developer.android.com/build/jdks) | Resolve Java/Gradle selection | Match the actual project's AGP requirements |

For reused samples, record URL, inspected commit, copied files, changes, and license/attribution. Amazon Devices Builder Tools can be evaluated if available; this review did not establish a connected instance or supported Fire OS workflow. Its absence need not block a standard Android toolchain build.

## 7. Minimum meaningful verification

Follow the existing PRD's tests, concentrating on the failure modes that could invalidate the demo:

- A seek from 00:20 to 01:30 must not make the skipped interval eligible evidence. A partially watched transcript segment must not expose its unwatched ending.
- The server rejects unknown source IDs and resolves timestamps itself. The model cannot initiate playback or select arbitrary URLs.
- New video, content version, or request generation invalidates old responses. Closing a panel restores focus and leaves playback paused.
- Quizzes return three supported questions with one correct option each, or an honest insufficient-evidence response. Human review checks factual support, not just JSON validity.
- Offline, timeout, throttling, malformed model output, and app backgrounding preserve usable controls.
- Hosted limits survive concurrent requests and multiple backend instances. Expiry is checked in authorization; database TTL cleanup is not the access decision.
- Keep credentials out of source, APK, public instructions, screenshots and logs. No durable shared cloud secret belongs in the client.

The PRD's 20 reviewed cases, ten repeated journeys, and measured latency targets remain project gates. Record results and any approved deviation; do not invent testers or measured performance. Use fixtures for deterministic development, and label them. Capture at least one real uncached model flow for the claimed AI functionality.

## 8. Submission assets to build alongside the code

| File / artifact | Start | Definition of ready |
| --- | --- | --- |
| `README.md` + `docs/toolchain.md` | G0 | Exact prerequisites, setup/build/run/test commands, emulator controls, media setup, troubleshooting and known limitations |
| `docs/progress.md` | G0 | Gate, requirement IDs, commit, commands/results, evidence locations, unresolved blockers and next task |
| `assets/ATTRIBUTION.md` | G0/G1 | Media and reused-code permissions plus required notices |
| `docs/product-feedback.md` | G0 | Actual per-tool observations addressing the fields below |
| `docs/friction-log.md` | First real issue | Reproducible observed problems; optional submission addition |
| `docs/evals.md` | G3 | Fixture/live distinction, evidence IDs, grounding failures, latency/token measurements |
| `docs/testing.md` + `docs/operations.md` | G5 | Install/run walkthrough; safe evaluation access; configuration, rollback, quota and availability procedures |
| `docs/submission.md` + `docs/demo-script.md` | Outline now; finish G7 | Accurate description, platform, public code/video links, tool list, feedback and limitation notes |
| Release bundle | G6/G7 | Tagged commit, build instructions, APK checksum, tested assets/configuration versions, screenshots and evidence |

**Product feedback entry — leave observations pending until tested:**

```text
Tool / API / SDK and version:
What I used it for:
Onboarding: steps, elapsed time, and first successful result:
What worked well, with an example:
What needs improvement, with reproduction/evidence:
Workaround and its impact:
Would I use it again? Yes/No, and why:
```

The official product-feedback requirement asks for tool purpose, strengths, weaknesses, onboarding and reuse intent. A friction log can add task, steps, expected/actual result, severity, workaround and improvement; it is optional. Never manufacture positive feedback or bugs. [S1]

### Demo outline — 2 minutes 45 seconds

| Time | On-screen proof |
| --- | --- |
| 0:00–0:15 | Explain the viewer problem; identify WatchMate and the Android TV emulator |
| 0:15–0:40 | D-pad navigation, clip selection, playback and pause |
| 0:40–1:15 | Request a real explanation, show the citation and explicitly replay its source |
| 1:15–1:45 | Show Simpler and Catch-up with the evidence boundary visible |
| 1:45–2:15 | Answer a quiz question incorrectly, then use source-based review/replay |
| 2:15–2:45 | Brief architecture, tools actually used, verified limitations and repository pointer |

Keep text readable and narration in English. Disclose cached/fixture behavior or edited waiting time; do not imply a fresh call or latency measurement where neither exists. Use permitted video/audio only. Measure the final export's duration. Publish to public YouTube or Vimeo and verify playback while signed out. [S1]

### Final check before authorized submission

- [ ] Working simulator demo corresponds to the submitted commit and APK.
- [ ] Public **GitHub** repository opens signed out and includes an appropriate open-source license, setup instructions, lockfile and permitted assets/acquisition instructions. [S2]
- [ ] Public video opens signed out and is less than 3:00.
- [ ] Product feedback describes tools actually used; sample attribution is complete.
- [ ] Fire TV is selected. AWS Builder is optional; describe real qualifying use if entering it. Do not add services solely for a prize category.
- [ ] Setup/test instructions and evaluation access work; no cloud secrets are exposed.
- [ ] Rules and FAQ rechecked; required submission fields reviewed; owner submits or explicitly authorizes submission; receipt retained.

**Evaluation operations:** judging is scheduled for 9–20 November. The rules require free evaluator access through judging; the FAQ says services need not run continuously beforehand. Keep source, video and reproducible deployment instructions accessible, and document any service shutdown/restart schedule. A conservative default is to keep the submitted serverless endpoint usable with bounded quotas. If pausing it, restore and verify it before judging and avoid leaving published testing instructions broken. [S1, S2]

## 9. Next evidence needed

The next required evidence is the **Windows environment-check result and first native build/emulator outcome** from the existing starter or newer checkout. If the owner has newer code, inspect that checkout first. AWS access, educational clip permissions and a spending ceiling remain separate dependencies; they do not prevent G0 with the included technical clip.

## Sources and review limits

The original 1 October review recorded a direct read of the Devpost registration email. This 6 October update uses the current saved documents and starter, and rechecks event rules/FAQ and Antigravity documentation. Historical preparation checks are retained as historical reports; they were not rerun for this documentation migration.

- [S1 — Official hackathon rules](https://amazonappdev2026.devpost.com/rules), originally reviewed 1 October; rules and FAQ rechecked 6 October 2026.
- [S2 — Official FAQ](https://amazonappdev2026.devpost.com/details/faqs), including Android TV emulator acceptance and GitHub requirements, originally reviewed 1 October; rules and FAQ rechecked 6 October 2026.
- [S3 — Official track resources](https://amazonappdev2026.devpost.com/resources), reviewed 1 October 2026.
- [S4 — Android Studio installation/system requirements](https://developer.android.com/studio/install), reviewed 1 October 2026. These are current published requirements; actual performance of the owner's already-installed setup remains unmeasured.
- [S5 — Android JDK/Gradle configuration](https://developer.android.com/build/jdks), reviewed 1 October 2026.

The sequence and target dates are engineering recommendations based on the existing scope. No project source build, Windows command, Bedrock invocation, deployment, physical-device test, repository publication, or Devpost submission was performed during this review.

Antigravity sources checked 6 October: [IDE](https://antigravity.google/docs/ide/overview/), [rules](https://antigravity.google/docs/rules/), [plans](https://antigravity.google/docs/implementation-plan/), [walkthrough](https://antigravity.google/docs/walkthrough/). See the companion setup guide for surface-specific instructions.
