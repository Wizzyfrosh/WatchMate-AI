# Asset and code provenance

## Native template

Source: https://github.com/react-native-tvos/template-tv
Package: @react-native-tvos/template-tv@0.81.0-0
Registry tarball SHA-1: 6d6ba89cb652e48a3b1342bdfde2cf257afdcc41
License: MIT; original notice retained as TV_TEMPLATE_LICENSE in this directory.
Adaptations: Android-only project named WatchMateTV/com.watchmatetv; RN patch version and tooling update; playback screen; local test asset; landscape/cleartext settings; release debug signing removed. Stock launcher icons/banner are temporary template assets.

## Playback test fixture

`apps/tv/assets/playback-test.mp4` was generated for this starter from FFmpeg testsrc2 video and a synthesized 440 Hz sine tone at low volume. No third-party film, music, narration or personal image was used. DejaVu Sans renders the technical label. It is a technical validation fixture, not a reviewed educational lesson. Its use does not resolve the final content catalog's permission/transcript gate.

Generation recipe: 20 seconds, 960x540, 24 fps, testsrc2; text label WatchMate - playback test; sine 440 Hz at volume 0.06; libx264 CRF 27/yuv420p; AAC 64 kbps; faststart MP4.

## Educational content packages (Phase 1 / G1)

### Lesson 01: Introduction to Solar System Astronomy
- **Catalog ID:** `lesson-01`
- **Transcript Version:** `v1`
- **Duration:** 180,000 ms (3:00)
- **Metadata:** `content/catalog.json`
- **Transcript:** `content/transcripts/lesson-01.json` (15 reviewed monotonic segments, validated)
- **WebVTT Captions:** `content/captions/lesson-01.vtt` (15 timestamp-aligned cues matching transcript)
- **Rights Record:** `content/rights.json` (`rights-lesson-01`, CC-BY-4.0 curriculum baseline, NASA public domain planetary facts)
- **Status:** `pending_media` — The video metadata, reviewed timestamped transcript, WebVTT captions, and rights attribution structure are prepared and validated. However, **no approved educational video MP4 file has been supplied by the project owner yet**. The actual media asset (`media/lesson-01.mp4`) remains pending owner selection and distribution clearance.
- **Integrity Rule:** Technical fixtures and test patterns are strictly labeled and NOT claimed as reviewed educational content.
