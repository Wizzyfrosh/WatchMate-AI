import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "./app.js";
import { MockAiProvider } from "./bedrock.js";
const testVideo = {
    id: "lesson-01",
    title: "Introduction to Solar System Astronomy",
    durationMs: 180000,
    description: "A foundational lesson exploring the sun and planets.",
    mediaKey: "media/lesson-01.mp4",
    captionsKey: "captions/lesson-01.vtt",
    transcriptVersion: "v1",
    rightsId: "rights-lesson-01",
};
const testTranscript = {
    videoId: "lesson-01",
    transcriptVersion: "v1",
    durationMs: 180000,
    segments: [
        { id: "seg-001", startMs: 0, endMs: 10000, text: "Welcome to Solar System Astronomy." },
        { id: "seg-002", startMs: 10500, endMs: 22000, text: "At the center of our system is the Sun." },
        { id: "seg-003", startMs: 22500, endMs: 35000, text: "Closest to the Sun are terrestrial planets." },
        { id: "seg-004", startMs: 35500, endMs: 48000, text: "Mercury is heavily cratered with no atmosphere." },
    ],
};
const mockContent = {
    catalog: [testVideo],
    videoMap: new Map([[testVideo.id, testVideo]]),
    transcriptMap: new Map([[testVideo.id, testTranscript]]),
};
describe("WatchMate Fastify Backend Routes", () => {
    const app = buildApp({ content: mockContent, isDev: true, aiProvider: new MockAiProvider() });
    it("GET /health returns minimal health status", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/health",
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.deepEqual(body, { status: "ok" });
        assert.ok(res.headers["x-correlation-id"]);
    });
    it("GET /v1/videos returns the approved catalog", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/v1/videos",
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(Array.isArray(body.videos), true);
        assert.equal(body.videos.length, 1);
        assert.equal(body.videos[0].id, "lesson-01");
    });
    it("GET /v1/videos/:id returns video detail with media/captions URLs", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/v1/videos/lesson-01",
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.id, "lesson-01");
        assert.equal(body.mediaUrl, "/media/lesson-01.mp4");
        assert.equal(body.captionsUrl, "/captions/lesson-01.vtt");
    });
    it("GET /v1/videos/:id returns 404 for unknown video ID", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/v1/videos/non-existent-lesson",
        });
        assert.equal(res.statusCode, 404);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "VIDEO_NOT_FOUND");
        assert.equal(typeof body.correlationId, "string");
        assert.equal(body.retryable, false);
    });
    it("POST /v1/assist returns grounded explanation and sources for eligible watched time", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 15000,
                watchedRanges: [[0, 15000]],
                detail: "standard",
                requestId: "req-test-1",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.equal(body.videoId, "lesson-01");
        assert.ok(body.text.length > 0);
        assert.ok(body.sources.length > 0);
        assert.equal(body.sources[0].segmentId, "seg-001");
        assert.equal(body.sources[0].startMs, 0);
        assert.equal(body.sources[0].endMs, 10000);
    });
    it("POST /v1/assist supports 'simple' detail mode", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 15000,
                watchedRanges: [[0, 15000]],
                detail: "simple",
                requestId: "req-test-simple",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "ok");
        assert.ok(body.text.startsWith("Simply put:"));
        assert.ok(body.sources.length > 0);
    });
    it("POST /v1/assist returns 504 when AI generation times out", async () => {
        const timeoutApp = buildApp({
            content: mockContent,
            isDev: true,
            aiProvider: new MockAiProvider("timeout"),
        });
        const res = await timeoutApp.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 15000,
                watchedRanges: [[0, 15000]],
                detail: "standard",
                requestId: "req-test-timeout",
            },
        });
        assert.equal(res.statusCode, 504);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "GENERATION_TIMEOUT");
        assert.equal(body.retryable, true);
    });
    it("POST /v1/assist returns 502 when model outputs invalid citations", async () => {
        const invalidApp = buildApp({
            content: mockContent,
            isDev: true,
            aiProvider: new MockAiProvider("invalid_citation"),
        });
        const res = await invalidApp.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 15000,
                watchedRanges: [[0, 15000]],
                detail: "standard",
                requestId: "req-test-invalid-cite",
            },
        });
        assert.equal(res.statusCode, 502);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "INVALID_MODEL_OUTPUT");
        assert.equal(body.retryable, false);
    });
    it("POST /v1/assist returns insufficient_evidence when unwatched", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 0,
                watchedRanges: [],
                requestId: "req-test-2",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "insufficient_evidence");
        assert.equal(body.sources.length, 0);
    });
    it("POST /v1/assist returns 404 for unknown video ID", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "unknown-video",
                transcriptVersion: "v1",
                action: "explain",
                playheadMs: 15000,
                watchedRanges: [[0, 15000]],
                requestId: "req-test-3",
            },
        });
        assert.equal(res.statusCode, 404);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "VIDEO_NOT_FOUND");
    });
    it("POST /v1/assist returns 409 conflict for transcript version mismatch", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v999", // Mismatch
                action: "explain",
                playheadMs: 15000,
                watchedRanges: [[0, 15000]],
                requestId: "req-test-4",
            },
        });
        assert.equal(res.statusCode, 409);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "CONTENT_VERSION_CONFLICT");
    });
    it("POST /v1/assist returns 400 for malformed payload", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: {
                videoId: "lesson-01",
                // missing transcriptVersion, action, etc.
            },
        });
        assert.equal(res.statusCode, 400);
        const body = JSON.parse(res.payload);
        assert.equal(body.code, "INVALID_REQUEST_BODY");
    });
    it("POST /v1/quizzes returns insufficient_evidence when less than 3 segments watched", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/quizzes",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                playheadMs: 10000,
                watchedRanges: [[0, 10000]], // Only covers seg-001
                requestId: "quiz-test-1",
            },
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.payload);
        assert.equal(body.status, "insufficient_evidence");
        assert.equal(body.questions.length, 0);
    });
    it("POST /v1/quizzes returns 3 validated questions when sufficient content watched", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/quizzes",
            payload: {
                videoId: "lesson-01",
                transcriptVersion: "v1",
                playheadMs: 40000,
                watchedRanges: [[0, 40000]], // Covers seg-001, seg-002, seg-003
                requestId: "quiz-test-2",
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
    it("enforces 16KB body size limit (returns 413)", async () => {
        const largePayload = {
            videoId: "lesson-01",
            transcriptVersion: "v1",
            action: "explain",
            playheadMs: 15000,
            watchedRanges: [[0, 15000]],
            requestId: "req-large",
            extraBloat: "x".repeat(20000), // > 16 KB
        };
        const res = await app.inject({
            method: "POST",
            url: "/v1/assist",
            payload: largePayload,
        });
        assert.equal(res.statusCode, 413);
    });
    it("security guard: rejects DEV_AUTH_BYPASS in production mode", () => {
        const origEnv = process.env.NODE_ENV;
        const origBypass = process.env.DEV_AUTH_BYPASS;
        try {
            process.env.NODE_ENV = "production";
            process.env.DEV_AUTH_BYPASS = "true";
            assert.throws(() => buildApp({ content: mockContent, isDev: false }), /SECURITY_VIOLATION/);
        }
        finally {
            process.env.NODE_ENV = origEnv;
            process.env.DEV_AUTH_BYPASS = origBypass;
        }
    });
});
//# sourceMappingURL=api.test.js.map