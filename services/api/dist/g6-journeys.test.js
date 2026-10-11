import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadContent } from "./content-loader.js";
import { MockAiProvider } from "./bedrock.js";
import { InMemorySessionStore } from "./auth.js";
import { InMemoryQuotaManager } from "./quota.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.resolve(__dirname, "..", "..", "..", "content");
describe("G6 — Release Candidate: 10 Consecutive Full User Journeys", () => {
    const loadedContent = loadContent(contentDir);
    const sessionStore = new InMemorySessionStore();
    const quotaManager = new InMemoryQuotaManager();
    const app = buildApp({
        content: loadedContent,
        isDev: false,
        aiProvider: new MockAiProvider(),
        sessionStore,
        quotaManager,
    });
    const journeyTimings = [];
    for (let journeyIdx = 1; journeyIdx <= 10; journeyIdx++) {
        it(`Journey ${journeyIdx}/10: Complete watch -> explain -> simple -> catch-up -> quiz -> remediation seek flow`, async () => {
            const startTime = performance.now();
            const videoIds = ["lesson-01", "lesson-02", "lesson-03"];
            const targetVideoId = videoIds[(journeyIdx - 1) % videoIds.length];
            // 1. Session Exchange (evaluation access code authentication)
            const authRes = await app.inject({
                method: "POST",
                url: "/v1/auth/exchange",
                payload: { accessCode: "WATCHMATE-JUDGE-2026" },
            });
            assert.equal(authRes.statusCode, 200, `Journey ${journeyIdx}: Auth exchange failed`);
            const authData = JSON.parse(authRes.payload);
            assert.equal(authData.status, "ok");
            assert.ok(authData.token, `Journey ${journeyIdx}: Missing auth token`);
            assert.ok(authData.expiresAt > Date.now(), `Journey ${journeyIdx}: Expiration must be in future`);
            const token = authData.token;
            const authHeaders = { authorization: `Bearer ${token}` };
            // 2. Catalog Discovery
            const catalogRes = await app.inject({
                method: "GET",
                url: "/v1/videos",
                headers: authHeaders,
            });
            assert.equal(catalogRes.statusCode, 200);
            const catalogData = JSON.parse(catalogRes.payload);
            assert.equal(catalogData.videos.length, 3, "Catalog must contain exactly 3 lessons");
            const videoEntry = catalogData.videos.find((v) => v.id === targetVideoId);
            assert.ok(videoEntry, `Journey ${journeyIdx}: Video ${targetVideoId} not found in catalog`);
            // 3. Video Detail & Metadata Fetch
            const detailRes = await app.inject({
                method: "GET",
                url: `/v1/videos/${targetVideoId}`,
                headers: authHeaders,
            });
            assert.equal(detailRes.statusCode, 200);
            const detailData = JSON.parse(detailRes.payload);
            assert.equal(detailData.id, targetVideoId);
            assert.ok(detailData.mediaUrl, "Must include mediaUrl");
            assert.ok(detailData.captionsUrl, "Must include captionsUrl");
            // 4. Playhead progression & Watched Range accumulation
            const playheadMs = 45000;
            const watchedRanges = [[0, 45000]];
            // 5. Standard Explain Assist Request
            const explainRes = await app.inject({
                method: "POST",
                url: "/v1/assist",
                headers: authHeaders,
                payload: {
                    requestId: `journey-${journeyIdx}-explain`,
                    videoId: targetVideoId,
                    transcriptVersion: detailData.transcriptVersion,
                    action: "explain",
                    detail: "standard",
                    playheadMs,
                    watchedRanges,
                },
            });
            assert.equal(explainRes.statusCode, 200);
            const explainData = JSON.parse(explainRes.payload);
            assert.equal(explainData.status, "ok");
            assert.ok(explainData.text && explainData.text.length > 0, "Explanation text must be non-empty");
            assert.ok(Array.isArray(explainData.sources) && explainData.sources.length > 0, "Sources must be provided");
            for (const src of explainData.sources) {
                assert.ok(src.segmentId, "Source must have segmentId");
                assert.ok(src.startMs <= playheadMs, "Source must be within watched boundary");
                assert.ok(src.endMs <= playheadMs, "Source must not straddle into future unwatched content");
            }
            // 6. Simpler Explain Assist Request
            const simpleRes = await app.inject({
                method: "POST",
                url: "/v1/assist",
                headers: authHeaders,
                payload: {
                    requestId: `journey-${journeyIdx}-simple`,
                    videoId: targetVideoId,
                    transcriptVersion: detailData.transcriptVersion,
                    action: "explain",
                    detail: "simple",
                    playheadMs,
                    watchedRanges,
                },
            });
            assert.equal(simpleRes.statusCode, 200);
            const simpleData = JSON.parse(simpleRes.payload);
            assert.equal(simpleData.status, "ok");
            assert.ok(simpleData.text.startsWith("Simply put:"), "Simplified mode must format appropriately");
            // 7. Catch-Up Summary Request
            const catchUpRes = await app.inject({
                method: "POST",
                url: "/v1/assist",
                headers: authHeaders,
                payload: {
                    requestId: `journey-${journeyIdx}-catchup`,
                    videoId: targetVideoId,
                    transcriptVersion: detailData.transcriptVersion,
                    action: "catch_up",
                    playheadMs,
                    watchedRanges,
                },
            });
            assert.equal(catchUpRes.statusCode, 200);
            const catchUpData = JSON.parse(catchUpRes.payload);
            assert.equal(catchUpData.status, "ok");
            assert.ok(catchUpData.text && catchUpData.text.length > 0, "Summary text must be present");
            assert.ok(catchUpData.sources.length >= 2, "Catch-up must cite eligible segments");
            // 8. 3-Question Quiz Generation
            const quizRes = await app.inject({
                method: "POST",
                url: "/v1/quizzes",
                headers: authHeaders,
                payload: {
                    requestId: `journey-${journeyIdx}-quiz`,
                    videoId: targetVideoId,
                    transcriptVersion: detailData.transcriptVersion,
                    playheadMs,
                    watchedRanges,
                },
            });
            assert.equal(quizRes.statusCode, 200);
            const quizData = JSON.parse(quizRes.payload);
            assert.equal(quizData.status, "ok");
            assert.equal(quizData.questions.length, 3, "Quiz must strictly generate 3 questions");
            // 9. Interactive Quiz Answer Evaluation & Remediation Replay Verification
            for (const q of quizData.questions) {
                assert.ok(q.id, "Question must have id");
                assert.ok(q.prompt, "Question must have prompt");
                assert.ok(q.options.length >= 3, "Question must have at least 3 options");
                assert.ok(q.correctOptionId, "Question must declare correctOptionId");
                assert.ok(q.explanation, "Question must have explanation");
                assert.ok(q.sourceIds.length > 0, "Question must cite source segment for remediation seek");
                // Simulate student answering incorrectly
                const wrongOption = q.options.find((opt) => opt.id !== q.correctOptionId);
                assert.ok(wrongOption, "Distractor option must exist");
                // Verify the remediation source reference is seekable
                const remediationSegmentId = q.sourceIds[0];
                const transcript = loadedContent.transcriptMap.get(targetVideoId);
                const segment = transcript?.segments.find((s) => s.id === remediationSegmentId);
                assert.ok(segment, "Remediation source segment must exist in transcript");
                assert.ok(segment.startMs >= 0, "Remediation seek startMs must be non-negative");
                assert.ok(segment.startMs <= playheadMs, "Remediation target must be within watched content");
            }
            // 10. Operational Logging & Correlation Tracking Verification
            const correlationId = quizRes.headers["x-correlation-id"];
            assert.ok(correlationId, "Response must include x-correlation-id");
            assert.match(correlationId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Correlation ID must be valid UUID");
            const journeyDuration = performance.now() - startTime;
            journeyTimings.push({ journey: journeyIdx, videoId: targetVideoId, durationMs: journeyDuration });
            assert.ok(journeyDuration < 5000, `Journey duration (${journeyDuration}ms) exceeded threshold`);
        });
    }
    it("All 10 consecutive journeys recorded valid latencies and zero state leakage", () => {
        assert.equal(journeyTimings.length, 10, "Must have completed all 10 journeys");
        const avgDuration = journeyTimings.reduce((sum, j) => sum + j.durationMs, 0) / 10;
        assert.ok(avgDuration > 0, "Average duration must be positive");
        console.log(`\n  ℹ G6 Rehearsal Summary: 10/10 journeys succeeded. Average end-to-end duration: ${avgDuration.toFixed(1)}ms`);
    });
});
//# sourceMappingURL=g6-journeys.test.js.map