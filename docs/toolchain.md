# Candidate toolchain and observed checks

Updated 8 October 2026 for Antigravity.

Development editor: Google Antigravity IDE (Standalone), Windows x64. Runtime provider planned for the app: Amazon Bedrock.

| Component | Selected / observed | Status / Finding |
| --- | --- | --- |
| Template | @react-native-tvos/template-tv 0.81.0-0 | Intact |
| React | 19.1.0 | Intact |
| React Native TV | 0.81.5-0 (npm alias under react-native) | Intact |
| Video | react-native-video 6.19.3 | Intact |
| RN Babel / Metro / TypeScript / ESLint config | 0.81.5 | Intact |
| Community CLI | 20.0.0 | Intact |
| Gradle wrapper | 8.14.3 | Intact |
| Android Gradle Plugin | 8.11.0, from installed Gradle plugin version catalog | Intact |
| Kotlin | 2.1.20 | Intact |
| Android SDK | Platforms: android-36; Build Tools: 36.0.0 | FOUND at `C:\Users\user\AppData\Local\Android\Sdk` |
| NDK | 27.1.12297006 | FOUND at `C:\Users\user\AppData\Local\Android\Sdk\ndk\27.1.12297006` |
| JDK baseline | OpenJDK 21.0.9 (Android Studio JBR) | FOUND at `C:\Program Files\Android\Android Studio\jbr` |
| Execution Host | Windows 11, Node v24.13.0, Git 2.54.0.windows.1 | VERIFIED |
| Android TV AVD | Target: `Television_720p` | FOUND (AVD profile present) |

## Verification execution record (8 October 2026)

Executed in `apps/tv` on Windows 11 host:
- `node scripts/check-environment.mjs`: Node 24.13.0 OK, Git 2.54 OK, SDK 36 OK, NDK 27.1.12297006 OK, Television_720p AVD OK. Java on PATH OK when `JAVA_HOME` set to `C:\Program Files\Android\Android Studio\jbr`. Exit code 0 (PASSED).
- `npm run typecheck`: PASSED (code 0)
- `npm run lint`: PASSED (code 0)
- `npm test`: PASSED (2/2 tests passed: seek bounds & time formatting)
- `npm run bundle:android -- --max-workers 2`: PASSED (Bundle compiled cleanly to `.bundle-check/index.android.bundle`)

Native APK compilation (`gradlew assembleDebug`), emulator boot/device interaction, and video/audio playback verification are actively running.

## Phase 1 (G1) contracts and local API toolchain (11 October 2026)

- Shared contracts: `@watchmate/contracts` (`packages/contracts`), Zod 3.24.2, TypeScript 5.8.2. Verified with Node 24 native test runner (`node --test`).
- Local backend: Fastify 5.2.1, `@fastify/cors`, TypeScript 5.8.2. Validated with Node 24 native test runner (`node --test`).
- Content pipeline validator: `node content/validate.mjs` verifying WebVTT cue syntax, monotonic transcript timestamps, rights linking, and duration boundaries.
- Unified Phase 1 check: `node scripts/check-phase1.mjs` executing all contracts, content, API, and TV app regression checks in sequence.

References: https://github.com/react-native-tvos/template-tv ; https://github.com/react-native-tvos/react-native-tvos ; https://docs.thewidlarzgroup.com/react-native-video/docs/v6/intro/ ; https://developer.android.com/build/jdks


