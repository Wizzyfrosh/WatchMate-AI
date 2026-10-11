# Antigravity task — finish Phase 0 native verification

Read AGENTS.md, docs/AI_MASTER_PROMPT.md, the Phase 0 PRD section, README.md, docs/toolchain.md and docs/progress.md. Inspect the active project path, existing source, native configuration, package scripts, lockfile and current changes. Preserve the existing starter and any newer user work.

The known laptop is Windows 11 with 8 GB RAM, Android Studio installed and WHPX usable. Node 24.13.0/npm 11.6.2 were reported. Java, native build, AVD boot and device interaction remain unverified unless current evidence proves otherwise. First identify the actual execution host.

Prepare one concise plan and follow the installed client's review policy. Complete these steps within existing authorization:

1. Run `node scripts/check-environment.mjs` at the root on the actual Windows laptop. Inspect concrete failures; do not dump secret-bearing environment variables.
2. Inspect installed JDK/SDK tools before recommending reinstalls. Match the candidate Gradle/AGP requirements and align terminal/IDE Java selection. Record versions, not assumptions.
3. Use or help the owner create one compatible x86_64 Android TV AVD. Record API/image and Fire OS compatibility target; do not claim it is a Fire OS image.
4. In apps/tv, use the existing npm lockfile. Install dependencies and run relevant scripts from README. In PowerShell, use `npm.cmd` if the npm.ps1 shim is blocked. Do not weaken system execution policy or force dependency resolution.
5. Start Metro with bounded workers, build/install the existing app and diagnose actual native failures. Do not regenerate the shell or upgrade packages without a demonstrated compatibility reason.
6. Verify launch, visible D-pad focus, Select/Back, video/audio, play/pause, seek, replay, retry and background/return behavior. Ask the owner for exact manual actions if the emulator UI is not accessible; keep evidence honest.
7. Obtain a short usable recording and record the APK path. The included test-pattern video is adequate for G0; it is not final educational content.
8. Update docs/toolchain.md and docs/progress.md with host, commands, results, evidence and remaining blockers. Produce a concise walkthrough and review the diff.

Do not implement runtime AI or deploy AWS in this task. Keep one coding agent and one emulator. A JavaScript bundle, screenshot, browser demo or written walkthrough does not pass G0. Stop optional testing once the required evidence is sufficient.

Return G0 PASS/FAIL/PENDING, evidence paths, meaningful changes, unresolved issues and the next bounded task. If performance remains unusable after focused diagnosis, report the concrete machine bottleneck before adding features.
