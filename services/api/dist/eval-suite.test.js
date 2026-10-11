import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "./app.js";
import { loadContent } from "./content-loader.js";
import { MockAiProvider } from "./bedrock.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.resolve(__dirname, "../../../content");
const content = loadContent(contentDir);
const app = buildApp({ content, isDev: true, aiProvider: new MockAiProvider() });
describe("20-Case Evaluation Set: Grounding, Boundaries, and Learning Loop", () => {
    // Case 1: lesson-01 Standard Explain
    it("Case 01 [lesson-01]: Standard Explain returns grounded citations within eligible watched window", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 25000,
                watchedRanges: [[0, 25000]],
                detail: "standard",
                requestId: "eval-01",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.sources.length > 0);
        for (const src of body.sources) {
            assert.ok(src.startMs <= 25000);
        }
    });
    // Case 2: lesson-01 Simpler Explain
    it("Case 02 [lesson-01]: Simpler Explain adapts vocabulary while maintaining strict evidence grounding", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 25000,
                watchedRanges: [[0, 25000]],
                detail: "simple",
                requestId: "eval-02",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.text.startsWith("Simply put:"));
        assert.ok(body.sources.length > 0);
    });
    // Case 3: lesson-01 Catch-up
    it("Case 03 [lesson-01]: Catch-up summary covers watched sections up to playhead", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "catch_up",
                playheadMs: 35000,
                watchedRanges: [[0, 35000]],
                detail: "standard",
                requestId: "eval-03",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.text.startsWith("So far:"));
        assert.ok(body.sources.length > 0);
    });
    // Case 4: lesson-01 3-Question Quiz
    it("Case 04 [lesson-01]: 3-Question Quiz returns 3 validated questions with options and explanations", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/quizzes",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                playheadMs: 60000,
                watchedRanges: [[0, 60000]],
                requestId: "eval-04",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.equal(body.questions.length, 3);
        for (const q of body.questions) {
            assert.ok(q.options.length >= 3 && q.options.length <= 4);
            assert.ok(q.options.some((o) => o.id === q.correctOptionId));
            assert.ok(q.sourceIds.length > 0);
        }
    });
    // Case 5: lesson-01 Unwatched Explain returns insufficient_evidence
    it("Case 05 [lesson-01]: Unwatched video returns insufficient_evidence for Explain", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 0,
                watchedRanges: [],
                detail: "standard",
                requestId: "eval-05",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "insufficient_evidence");
        assert.equal(body.sources.length, 0);
    });
    // Case 6: lesson-01 < 3 segments watched returns insufficient_evidence for Quiz
    it("Case 06 [lesson-01]: Fewer than 3 watched segments returns insufficient_evidence for Quiz", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/quizzes",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                playheadMs: 10000,
                watchedRanges: [[0, 10000]],
                requestId: "eval-06",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "insufficient_evidence");
        assert.equal(body.questions.length, 0);
    });
    // Case 7: Straddling segment boundary exclusion
    it("Case 07: Straddling segment (unwatched ending) is strictly excluded to prevent text leakage", async () => {
        // seg-002 is [10500, 22000]. If playhead is 18000, seg-002 straddles and must be excluded.
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 18000,
                watchedRanges: [[0, 18000]],
                detail: "standard",
                requestId: "eval-07",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        // Only seg-001 [0, 10000] should be cited, not straddling seg-002
        assert.ok(body.sources.every((s) => s.segmentId === "seg-001"));
    });
    // Case 8: Seek skips exclusion
    it("Case 08: Seek jumps do not make skipped segments eligible for evidence", async () => {
        // Watched [0, 10000] (seg-001) then jumped forward to [60500, 72000] (seg-006)
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "catch_up",
                playheadMs: 72000,
                watchedRanges: [
                    [0, 10000],
                    [60500, 72000],
                ],
                detail: "standard",
                requestId: "eval-08",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        const citedIds = body.sources.map((s) => s.segmentId);
        assert.ok(!citedIds.includes("seg-002"));
        assert.ok(!citedIds.includes("seg-003"));
        assert.ok(!citedIds.includes("seg-004"));
        assert.ok(!citedIds.includes("seg-005"));
    });
    // Case 9: Future segments beyond playhead excluded
    it("Case 09: Segments beyond playhead are strictly omitted", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 25000,
                watchedRanges: [[0, 180000]], // Claimed watched beyond playhead
                detail: "standard",
                requestId: "eval-09",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        for (const src of body.sources) {
            assert.ok(src.endMs <= 25000);
        }
    });
    // Case 10: Server-side source reference trusted timestamp accuracy
    it("Case 10: Source reference timestamps originate strictly from trusted server transcript", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 35000,
                watchedRanges: [[0, 35000]],
                detail: "standard",
                requestId: "eval-10",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        const src1 = body.sources.find((s) => s.segmentId === "seg-001");
        if (src1) {
            assert.equal(src1.startMs, 0);
            assert.equal(src1.endMs, 10000);
        }
    });
    // Case 11: lesson-02 Standard Explain
    it("Case 11 [lesson-02]: Standard Explain on Earth Atmosphere returns valid citations", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-02",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 35000,
                watchedRanges: [[0, 35000]],
                detail: "standard",
                requestId: "eval-11",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.sources.length > 0);
    });
    // Case 12: lesson-02 Catch-up
    it("Case 12 [lesson-02]: Catch-up summary over troposphere and stratosphere sections", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-02",
                transcriptVersion: "v1",
                action: "catch_up",
                playheadMs: 48000,
                watchedRanges: [[0, 48000]],
                detail: "standard",
                requestId: "eval-12",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.text.includes("So far:"));
    });
    // Case 13: lesson-02 3-Question Quiz
    it("Case 13 [lesson-02]: 3-Question Quiz generated from atmospheric science content", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/quizzes",
            payload: {
                videoId: "lesson-02",
                transcriptVersion: "v1",
                playheadMs: 60000,
                watchedRanges: [[0, 60000]],
                requestId: "eval-13",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.equal(body.questions.length, 3);
    });
    // Case 14: Unknown video ID returns 404
    it("Case 14: Unknown video ID returns 404 standard error envelope", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "unknown-lesson-99",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 20000,
                watchedRanges: [[0, 20000]],
                detail: "standard",
                requestId: "eval-14",
            },
        });
        assert.equal(res.statusCode, 404);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "VIDEO_NOT_FOUND");
        assert.equal(typeof body.correlationId, "string");
    });
    // Case 15: Transcript version mismatch returns 409
    it("Case 15: Transcript version mismatch returns 409 conflict error", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-02",
                transcriptVersion: "v2-mismatch",
                action: "explain",
                playheadMs: 20000,
                watchedRanges: [[0, 20000]],
                detail: "standard",
                requestId: "eval-15",
            },
        });
        assert.equal(res.statusCode, 409);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "CONTENT_VERSION_CONFLICT");
    });
    // Case 16: lesson-03 Standard Explain
    it("Case 16 [lesson-03]: Standard Explain over water cycle content returns valid citations", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-03",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 35000,
                watchedRanges: [[0, 35000]],
                detail: "standard",
                requestId: "eval-16",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.sources.length > 0);
    });
    // Case 17: lesson-03 Simpler Explain
    it("Case 17 [lesson-03]: Simpler Explain over evaporation and condensation", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-03",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 48000,
                watchedRanges: [[0, 48000]],
                detail: "simple",
                requestId: "eval-17",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.text.startsWith("Simply put:"));
    });
    // Case 18: lesson-03 Catch-up
    it("Case 18 [lesson-03]: Catch-up summary over oceans, freshwater, and clouds", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-03",
                transcriptVersion: "v1",
                action: "catch_up",
                playheadMs: 60000,
                watchedRanges: [[0, 60000]],
                detail: "standard",
                requestId: "eval-18",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.text.includes("So far:"));
    });
    // Case 19: lesson-03 3-Question Quiz
    it("Case 19 [lesson-03]: 3-Question Quiz generated from hydrosphere content", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/quizzes",
            payload: {
                videoId: "lesson-03",
                transcriptVersion: "v1",
                playheadMs: 60000,
                watchedRanges: [[0, 60000]],
                requestId: "eval-19",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.equal(body.questions.length, 3);
    });
    // Case 20: Source replay timestamp verification
    it("Case 20: Replay source timestamps strictly correspond to segment startMs and allow exact player seek", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 48000,
                watchedRanges: [[0, 48000]],
                detail: "standard",
                requestId: "eval-20",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        for (const src of body.sources) {
            assert.equal(typeof src.startMs, "number");
            assert.equal(typeof src.endMs, "number");
            assert.ok(src.startMs < src.endMs);
            assert.ok(src.startMs <= 48000);
        }
    });
});
//# sourceMappingURL=eval-suite.test.js.map