# WatchMate AI — Antigravity setup and development workflow

Version 1.1 • 6 October 2026 • Windows 11 • Prepared for Umanor Wisdom Chizoba / WizzyFrosh

## What this update provides

Use **Google Antigravity IDE (Standalone)** as the primary editor and coding assistant. Android Studio supplies Android SDK tools and the TV emulator. The application remains TypeScript/react-native-tvos with the planned Node/Fastify/Zod backend and server-side Amazon Bedrock integration.

The revised ZIP contains the existing Phase 0 source, its lockfile and technical test video, updated AGENTS.md, PRD, master prompt, execution plan, and these instructions. The application source was preserved during the migration. A successful native build and emulator run are still pending; the archived preparation checks do not establish laptop success.

The change to Antigravity does not require a Google runtime API key, Google Cloud hosting, Firebase, a different app framework or a second coding assistant. Sign-in and coding usage limits are determined by your Antigravity account; check the actual account UI rather than assuming unlimited usage.

## 1. Install the intended Antigravity surface

1. Open the [official download page](https://antigravity.google/download).
2. Select Windows and find **Antigravity IDE (Standalone)**. Download **x64** for the recorded Intel laptop. The page also offers Antigravity 2.0 and CLI; this guide uses the standalone IDE so files, terminal and agent review are together.
3. Install, open the IDE and complete its Google account sign-in flow. Record the installed version in `docs/toolchain.md`.
4. Retain your existing Android Studio, Node.js, npm and Git installations. Diagnose compatibility before changing versions.

If you already use Antigravity 2.0, the project files still apply. Its navigation/settings can differ; open the same local folder. Use its `/plan` command where available. In the IDE, choose Planning when available or explicitly request a short implementation plan in the chat. Do not install both interfaces just for this project.

## 2. Extract or merge the updated project

For a fresh setup, extract `WatchMateAI_Antigravity_Starter.zip` into a short local path. The ZIP contains a top-level `WatchMateAI` folder. A suitable destination is:

```text
C:\Users\user\Projects\WatchMateAI
```

Open the inner folder containing `AGENTS.md`, `README.md`, `apps` and `docs`. Avoid opening the parent folder or only `apps/tv` for your first project session.

If you already developed the app after the original starter, create a Git checkpoint and merge the updated documentation with a diff. Preserve your newer `apps/tv`, native configuration, package manifests and lockfiles. The archive is not an instruction to replace newer source.

| Project file | Purpose |
| --- | --- |
| `AGENTS.md` | Persistent project constraints, automatically supported by current Antigravity |
| `docs/PRD.md` | Product, architecture, UX, security and acceptance requirements |
| `docs/AI_MASTER_PROMPT.md` | Overall implementation mandate; explicitly ask the agent to read it |
| `docs/ANTIGRAVITY_WORKFLOW.md` | This setup and working guide |
| `docs/tasks/phase0.md` | First native build and playback task |
| `docs/tasks/next-phase.md` | Continue one phase after its prerequisite passes |
| `docs/tasks/debug.md` | Investigate a concrete failure without unrelated changes |
| `docs/progress.md` | Actual results, pending gates and next action |
| `docs/toolchain.md` | Candidate/verified versions and exact commands |
| `docs/execution-plan.md` | Revised targets and submission dependencies |
| `docs/migration-notes.md` | What changed in this documentation migration |

The PDF is a reading copy. Maintain the editable Markdown as the project specification.

## 3. Configure project access and review

Open the folder through Antigravity's **Open Folder** action. Use one coding-agent conversation for the current task. In the IDE's agent settings, begin with **Terminal Command Auto Execution: Request Review** and retain the normal workspace boundary. Approve concrete installation/build commands after inspecting them; use narrowly scoped allow rules only when their behavior is understood. Settings differ by Antigravity surface and version. [A3]

An Android build needs access to installed SDK/JDK tools, Gradle caches and package downloads. If a boundary blocks one of these, have the agent name the exact path or command. Use the client's supported access control or run that documented command yourself. Do not grant unrestricted disk access as a generic repair.

Open the agent panel's **… → Customizations → Rules** when you need to inspect configured rules. Current Antigravity reads root `AGENTS.md` without frontmatter. Keep this as the single canonical rule file; a duplicate `GEMINI.md` or copy of the full PRD in global rules is unnecessary. [A2]

The first task should report the active project path and instruction files. That is a useful integration check; simply having a file in the ZIP is not proof the intended workspace is open.

## 4. Start the first Antigravity task

Open a new project conversation. Paste:

```text
Read AGENTS.md, docs/AI_MASTER_PROMPT.md, docs/progress.md,
docs/toolchain.md and docs/tasks/phase0.md.

Confirm the project path and instruction files you read. Inspect the
existing source and preserve all user changes. Use docs/PRD.md for the
requirements and docs/execution-plan.md for current planning targets.

Continue the supplied Phase 0 starter. Produce a short implementation
plan, then follow the configured review policy and carry out the
authorized G0 work. Do not re-scaffold the app or mark a gate passed
without the required native evidence. Give exact manual steps for
Android Studio actions that require me.
```

Review the plan for the specific build blocker, files to change and expected evidence. If it proposes a website, a framework migration or cloud provisioning for G0, correct the scope before proceeding. Once accepted, let it complete the phase task. Use the implementation-plan and walkthrough artifacts for review, and retain the actual outcome in `docs/progress.md`. [A4, A5]

## 5. Check the laptop environment

Antigravity can run this from the project root, or you can use its terminal:

```powershell
node scripts/check-environment.mjs
```

Run it once and use the specific failure to guide the next action. It checks availability; it does not certify compatibility or that an AVD has booted.

Known starting observations: Windows 11, 8 GB RAM, WHPX usable, Node 24.13.0, npm 11.6.2, Git 2.54.0.windows.1, Android Studio installed, and Java previously unresolved in the terminal.

If Java is missing from PATH, inspect Android Studio's bundled runtime first. For the standard install location, this is a **PowerShell** command:

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" -version
```

If that path is absent, locate your actual installation. Match the JDK to the starter's Gradle/AGP requirements; the recorded baseline is JDK 17. A different bundled JDK is not automatically compatible or incompatible. Have the agent check the actual version before setting `JAVA_HOME`. Align the terminal and Android Studio Gradle JDK, then reopen terminals after environment changes.

The starter's candidate Android configuration uses SDK 36, Build Tools 36.0.0 and NDK 27.1.12297006. Check SDK Manager for these components; install only missing requirements. Keep the selected dependency matrix until a demonstrated compatibility problem warrants a change. The compile SDK and the emulator API level are separate choices.

## 6. Boot one TV emulator

In Android Studio, open **Device Manager** from the welcome-screen tools or the Tools menu. Use an existing Android TV device or create one with an available x86_64 TV image. The starter records API 30 as its initial compatibility target; record whichever compatible image you actually test.

Start one AVD and wait for its TV launcher. Confirm it is visible to ADB. Use the SDK location shown by Android Studio if ADB is not on PATH. This is an Android TV image, not a Fire OS image; record that distinction in the demo evidence.

Your 8 GB machine is below the current published 16 GB Studio-plus-Emulator baseline. [A7] This makes G0 a real feasibility test. Close unused browsers and IDE windows; test recording as well as playback. If two focused attempts still produce unusable performance, diagnose the bottleneck and consider a stronger borrowed development machine while keeping the emulator approach. Do not spend days polishing UI before proving this.

## 7. Install, check and run the existing app

Commands below are for **Windows PowerShell**. `npm.cmd` avoids an `npm.ps1` execution-policy error without weakening your machine's policy.

In terminal 1, starting at the project root:

```powershell
Set-Location apps/tv
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd start -- --max-workers 2
```

`npm ci` installs the lockfile. Run the checks once for this setup and rerun affected checks after fixes. Leave Metro running in terminal 1.

Open terminal 2 at the project root:

```powershell
Set-Location apps/tv
npm.cmd run android -- --active-arch-only --no-packager
```

The source contains these scripts, but this migration did not execute the Windows build. A first build may need native downloads. Investigate the first meaningful failure before changing packages. Do not use `--force` or `--legacy-peer-deps` as a shortcut.

If PowerShell opens in `apps/tv` already, omit `Set-Location apps/tv`. If a terminal starts elsewhere, navigate to the real checkout first. Do not assume the command runs from the project root.

If the app cannot reach Metro, inspect `adb devices` and the local debug connection before trying:

```powershell
adb reverse tcp:8081 tcp:8081
```

The expected debug artifact is `apps/tv/android/app/build/outputs/apk/debug/app-debug.apk`. A Metro startup or `bundle:android` result is not that APK. G0 uses a debug app; a standalone signed submission release is later work.

## 8. Prove G0 on the TV surface

Use the emulator's directional controls, Select and Back. Complete the README checklist: visible focus, app launch, video/audio, play/pause, bounded seek, replay, retry, Back and background/return behavior. Capture 30–60 seconds showing usable playback and navigation.

The included 20-second technical video proves playback feasibility; it is not one of the three final educational clips. Before G1 completes, choose the first permitted educational clip and review its transcript/captions.

Ask Antigravity to save the machine, versions, commands/results, APK path, recording path and remaining failures in `docs/progress.md`. Keep G0 **PENDING** until the native evidence exists. If you performed a manual check, record it as owner-observed; the agent should not pretend it operated the emulator.

## 9. Use this development rhythm

1. Select one phase or one reproducible bug from actual progress.
2. Ask the agent to read the matching task file and relevant PRD requirements.
3. Review a short plan for substantial changes; small fixes can use a direct task.
4. Let the agent implement and run only meaningful checks for the risk involved.
5. Inspect the diff and walkthrough; verify TV behavior on the emulator when affected.
6. Update progress, toolchain and honest product feedback. Review the staged files and make a focused Git checkpoint.
7. Start the next phase only when its prerequisite passes, or record a deliberate independent task without mislabeling the gate.

For a fresh extracted project without Git history, initialize once with `git init`. Use your real commit identity when Git asks. Keep credentials and generated outputs ignored. Preserve existing history when working in a current checkout; never reset it just to match this guide.

Do not rerun every audit after a small copy change. Use the relevant checks, then continue building. Keep browser research targeted to unresolved compatibility/API questions. A browser recording is useful only for browser surfaces; the TV submission requires actual emulator footage.

## 10. Follow the revised gate sequence

These targets are aggressive and depend on your available hours. Gates and P0 scope remain binding; missed dates require replanning, not false completion.

| Target dates, October 2026 | Gate | Required outcome |
| --- | --- | --- |
| 6–7 | G0 | Native APK, usable TV playback and a short recording |
| 8 | G1 | Contracts, local API, first reviewed educational clip |
| 9–10 | G2 | Full playback, captions, resume, focus and watched ranges |
| 11–13 | G3 | Real Bedrock Explain → citation → Replay; Simpler |
| 14–15 | G4 | Catch-up, quiz/review, three reviewed clips and evaluations |
| 16–18 | G5 | Hosted access, atomic quotas, idempotency and recovery |
| 19–20 | G6 | Reproducible release, native regression and rehearsal |
| 21 | G7 | Reviewed public repository, demo, feedback and submission |
| 22–23 | Buffer | Resolve delivery/access problems; no new scope |

Check AWS/model access and content rights early while G0/G1 proceeds. Make paid calls or deployments only within an agreed allowance. Keep saved cards and QR handoff out of this schedule. The event deadline is **23 October, 12:00 p.m. PDT / 8:00 p.m. WAT**. [A8]

After G0, paste:

```text
Read AGENTS.md, docs/progress.md and docs/tasks/next-phase.md.
Identify the next incomplete phase whose dependencies passed.
Use the PRD acceptance gate, implement only that phase, run the
relevant checks and update the evidence. Preserve existing work.
```

## 11. Add Amazon tooling when it helps the next task

Bedrock is the planned runtime service. Amazon Devices Builder Tools are optional development assistance and must support the specific Fire OS task. Use official instructions and Antigravity's MCP configuration for the installed surface; do not paste guessed server commands or credentials into the repository. Verify tool discovery and one harmless documentation query before marking a connection working. [A9]

Antigravity use alone does not establish the AWS Builder mini-challenge requirement. Record actual qualifying AWS integration if entering it. Retain the public GitHub route, tool feedback and emulator demo. The FAQ accepts Android TV Emulator demonstrations without a physical Fire TV. [A8, A10]

## 12. Resolve problems without losing work

| Symptom | Next action |
| --- | --- |
| Agent cannot find the PRD | Confirm the opened root and `docs/PRD.md`; fix the path |
| Wrong project's instructions appear | Inspect active/global rules; report the conflict before adopting them |
| Java missing | Locate bundled JDK, inspect version and align PATH/JAVA_HOME with Gradle |
| `npm.ps1` blocked | Use `npm.cmd` in PowerShell |
| Gradle or dependency failure | Preserve the lockfile; capture the first meaningful error and use `docs/tasks/debug.md` |
| AVD missing/offline | Inspect Device Manager and ADB; native testing stays pending |
| Emulator/recording unusably slow | Measure resource use, reduce competing processes and resolve the hardware bottleneck |
| Agent claims a native test from a browser preview | Require actual APK/emulator evidence and correct the progress record |
| Amazon MCP unavailable | Continue documented local build work; record integration as unavailable |
| Coding usage limit reached | Save progress and changes; resume from files when access returns |

This package uses plain Markdown task prompts. No custom slash workflow is installed or required. Google documents a move from legacy Workflows to skills by 1 November 2026; adding optional automation later should follow that current mechanism. [A6]

## Sources and verification limits

Official Antigravity, event and Android hardware pages checked 6 October 2026. The source starter and stored preparation notes were inspected. Antigravity was not installed or operated on the owner's laptop during this update. No new application tests, native build, emulator run, cloud call, deployment or submission occurred.

- A1: [IDE and download](https://antigravity.google/docs/ide/overview/) · [Download page](https://antigravity.google/download)
- A2: [Rules and AGENTS.md](https://antigravity.google/docs/rules/)
- A3: [IDE settings](https://antigravity.google/docs/settings?tab=ide)
- A4: [Implementation plan](https://antigravity.google/docs/implementation-plan/)
- A5: [Walkthrough](https://antigravity.google/docs/walkthrough/)
- A6: [Legacy workflows and migration notice](https://antigravity.google/docs/ide/workflows/)
- A7: [Android Studio requirements](https://developer.android.com/studio/install?hl=en)
- A8: [Hackathon rules](https://amazonappdev2026.devpost.com/rules)
- A9: [Antigravity MCP](https://antigravity.google/docs/mcp/)
- A10: [Hackathon FAQ](https://amazonappdev2026.devpost.com/details/faqs)
