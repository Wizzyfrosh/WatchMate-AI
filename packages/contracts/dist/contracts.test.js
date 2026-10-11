import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VideoRecordSchema, CatalogSchema, SegmentSchema, TranscriptSchema, normalizeWatchedRanges, selectEligibleSegments, selectExplainSegments, resolveSourceReferences, AssistRequestSchema, AssistResponseSchema, QuizQuestionSchema, QuizResponseSchema, ErrorResponseSchema, RightsRecordSchema, } from "./index.js";
describe("Catalog and VideoRecord Schemas", () => {
    it("validates a well-formed video record", () => {
        const valid = {
            id: "lesson-01",
            title: "Introduction to Solar System Astronomy",
            durationMs: 180000,
            description: "A foundational overview of the solar system.",
            mediaKey: "media/lesson-01.mp4",
            captionsKey: "captions/lesson-01.vtt",
            transcriptVersion: "v1",
            rightsId: "rights-lesson-01",
        };
        const parsed = VideoRecordSchema.safeParse(valid);
        assert.equal(parsed.success, true);
    });
    it("rejects negative or zero duration", () => {
        const invalid = {
            id: "lesson-01",
            title: "Test",
            durationMs: -500,
            description: "Test description",
            mediaKey: "media/test.mp4",
            captionsKey: "captions/test.vtt",
            transcriptVersion: "v1",
            rightsId: "rights-01",
        };
        const parsed = VideoRecordSchema.safeParse(invalid);
        assert.equal(parsed.success, false);
    });
    it("rejects catalog with duplicate video IDs", () => {
        const videos = [
            {
                id: "lesson-01",
                title: "Lesson 1",
                durationMs: 60000,
                description: "Desc",
                mediaKey: "media/1.mp4",
                captionsKey: "captions/1.vtt",
                transcriptVersion: "v1",
                rightsId: "rights-01",
            },
            {
                id: "lesson-01", // duplicate
                title: "Lesson 1 Dup",
                durationMs: 60000,
                description: "Desc",
                mediaKey: "media/1-dup.mp4",
                captionsKey: "captions/1.vtt",
                transcriptVersion: "v1",
                rightsId: "rights-01",
            },
        ];
        const parsed = CatalogSchema.safeParse(videos);
        assert.equal(parsed.success, false);
    });
});
describe("Transcript and Segment Schemas", () => {
    it("validates well-formed monotonic transcript within duration", () => {
        const valid = {
            videoId: "lesson-01",
            transcriptVersion: "v1",
            durationMs: 30000,
            segments: [
                { id: "seg-01", startMs: 0, endMs: 5000, text: "Welcome to the lesson." },
                { id: "seg-02", startMs: 5500, endMs: 12000, text: "Our solar system has eight planets." },
                { id: "seg-03", startMs: 12000, endMs: 25000, text: "The inner four are terrestrial." },
            ],
        };
        const parsed = TranscriptSchema.safeParse(valid);
        assert.equal(parsed.success, true);
    });
    it("rejects segment where startMs >= endMs", () => {
        const invalidSeg = { id: "seg-01", startMs: 5000, endMs: 5000, text: "Invalid" };
        const parsed = SegmentSchema.safeParse(invalidSeg);
        assert.equal(parsed.success, false);
    });
    it("rejects duplicate segment IDs", () => {
        const transcript = {
            videoId: "lesson-01",
            transcriptVersion: "v1",
            durationMs: 30000,
            segments: [
                { id: "seg-01", startMs: 0, endMs: 5000, text: "First" },
                { id: "seg-01", startMs: 5500, endMs: 10000, text: "Duplicate ID" },
            ],
        };
        const parsed = TranscriptSchema.safeParse(transcript);
        assert.equal(parsed.success, false);
    });
    it("rejects non-monotonic segment start times", () => {
        const transcript = {
            videoId: "lesson-01",
            transcriptVersion: "v1",
            durationMs: 30000,
            segments: [
                { id: "seg-01", startMs: 10000, endMs: 15000, text: "First" },
                { id: "seg-02", startMs: 5000, endMs: 8000, text: "Non-monotonic backward start" },
            ],
        };
        const parsed = TranscriptSchema.safeParse(transcript);
        assert.equal(parsed.success, false);
    });
    it("rejects segments extending beyond video duration", () => {
        const transcript = {
            videoId: "lesson-01",
            transcriptVersion: "v1",
            durationMs: 20000,
            segments: [
                { id: "seg-01", startMs: 0, endMs: 25000, text: "Exceeds duration" },
            ],
        };
        const parsed = TranscriptSchema.safeParse(transcript);
        assert.equal(parsed.success, false);
    });
});
describe("Evidence Normalization and Selection", () => {
    it("normalizes, clamps to playhead, sorts, and merges overlapping ranges", () => {
        const rawRanges = [
            [30000, 50000],
            [0, 20000],
            [15000, 25000], // overlaps [0, 20000] -> [0, 25000]
            [70000, 100000], // playhead is 80000 -> clamped to [70000, 80000]
        ];
        const normalized = normalizeWatchedRanges(rawRanges, 80000);
        assert.deepEqual(normalized, [
            [0, 25000],
            [30000, 50000],
            [70000, 80000],
        ]);
    });
    it("seek skips do not make skipped time eligible", () => {
        // Viewer watched 0-20s, then jumped to 60s and watched up to 75s
        const ranges = [
            [0, 20000],
            [60000, 75000],
        ];
        const segments = [
            { id: "seg-01", startMs: 0, endMs: 10000, text: "Watched" },
            { id: "seg-02", startMs: 30000, endMs: 45000, text: "Skipped" },
            { id: "seg-03", startMs: 60000, endMs: 70000, text: "Watched after seek" },
        ];
        const eligible = selectEligibleSegments(segments, ranges);
        assert.equal(eligible.length, 2);
        assert.equal(eligible[0].id, "seg-01");
        assert.equal(eligible[1].id, "seg-03");
    });
    it("excludes straddling segments so unwatched text is never exposed", () => {
        // Watched up to 25s
        const ranges = [[0, 25000]];
        const segments = [
            { id: "seg-01", startMs: 0, endMs: 20000, text: "Completely watched" },
            // Straddles playhead (starts at 22s, ends at 30s)
            { id: "seg-02", startMs: 22000, endMs: 30000, text: "Partially unwatched" },
        ];
        const eligible = selectEligibleSegments(segments, ranges);
        assert.equal(eligible.length, 1);
        assert.equal(eligible[0].id, "seg-01");
    });
    it("selectExplainSegments restricts to the recent window", () => {
        const ranges = [[0, 120000]];
        const segments = [
            { id: "seg-01", startMs: 0, endMs: 15000, text: "Early segment" },
            { id: "seg-02", startMs: 70000, endMs: 85000, text: "Recent segment 1" },
            { id: "seg-03", startMs: 90000, endMs: 100000, text: "Recent segment 2" },
        ];
        const explainSegments = selectExplainSegments(segments, ranges, 100000, 40000); // 40s window: 60000 - 100000
        assert.equal(explainSegments.length, 2);
        assert.equal(explainSegments[0].id, "seg-02");
        assert.equal(explainSegments[1].id, "seg-03");
    });
});
describe("Source Reference Resolution", () => {
    const transcript = {
        videoId: "lesson-01",
        transcriptVersion: "v1",
        durationMs: 60000,
        segments: [
            { id: "seg-01", startMs: 0, endMs: 10000, text: "First segment" },
            { id: "seg-02", startMs: 10000, endMs: 20000, text: "Second segment" },
        ],
    };
    it("resolves valid segment IDs with trusted timestamps from server transcript", () => {
        const resolved = resolveSourceReferences(["seg-01"], transcript);
        assert.equal(resolved.length, 1);
        assert.equal(resolved[0].segmentId, "seg-01");
        assert.equal(resolved[0].startMs, 0);
        assert.equal(resolved[0].endMs, 10000);
    });
    it("throws when resolving unknown segment ID", () => {
        assert.throws(() => resolveSourceReferences(["seg-999"], transcript), /Unknown source segment ID/);
    });
});
describe("API Contracts and Validation", () => {
    it("validates assist request", () => {
        const req = {
            videoId: "lesson-01",
            transcriptVersion: "v1",
            action: "explain",
            playheadMs: 15000,
            watchedRanges: [[0, 15000]],
            detail: "simple",
            requestId: "req-12345",
        };
        const parsed = AssistRequestSchema.safeParse(req);
        assert.equal(parsed.success, true);
    });
    it("rejects unknown action or detail", () => {
        const invalidReq = {
            videoId: "lesson-01",
            transcriptVersion: "v1",
            action: "dance", // invalid
            playheadMs: 15000,
            watchedRanges: [[0, 15000]],
            requestId: "req-12345",
        };
        const parsed = AssistRequestSchema.safeParse(invalidReq);
        assert.equal(parsed.success, false);
    });
    it("validates successful assist response with source tuples", () => {
        const res = {
            status: "ok",
            requestId: "req-12345",
            videoId: "lesson-01",
            transcriptVersion: "v1",
            action: "explain",
            text: "The solar system has eight planets.",
            sources: [{ segmentId: "seg-01", startMs: 0, endMs: 10000 }],
        };
        const parsed = AssistResponseSchema.safeParse(res);
        assert.equal(parsed.success, true);
    });
    it("rejects successful quiz with fewer or more than 3 questions", () => {
        const res = {
            status: "ok",
            quizId: "quiz-01",
            videoId: "lesson-01",
            questions: [
                {
                    id: "q-1",
                    prompt: "How many planets?",
                    options: [
                        { id: "opt-1", text: "8" },
                        { id: "opt-2", text: "9" },
                        { id: "opt-3", text: "10" },
                    ],
                    correctOptionId: "opt-1",
                    explanation: "There are eight recognised planets.",
                    sourceIds: ["seg-01"],
                },
            ], // Only 1 question, must be 3
        };
        const parsed = QuizResponseSchema.safeParse(res);
        assert.equal(parsed.success, false);
    });
    it("validates quiz question requires unique option IDs and valid correctOptionId", () => {
        const invalidQ = {
            id: "q-1",
            prompt: "Prompt",
            options: [
                { id: "opt-1", text: "A" },
                { id: "opt-1", text: "Duplicate ID" },
                { id: "opt-2", text: "C" },
            ],
            correctOptionId: "opt-1",
            explanation: "Exp",
            sourceIds: ["seg-01"],
        };
        const parsed = QuizQuestionSchema.safeParse(invalidQ);
        assert.equal(parsed.success, false);
    });
    it("validates standard error envelope", () => {
        const err = {
            code: "INVALID_CONTEXT",
            message: "The requested timestamp is outside the video bounds",
            correlationId: "corr-987",
            retryable: false,
        };
        const parsed = ErrorResponseSchema.safeParse(err);
        assert.equal(parsed.success, true);
    });
    it("validates rights record", () => {
        const rights = {
            rightsId: "rights-lesson-01",
            title: "Solar System Primer",
            sourceUrl: "https://example.com/source",
            owner: "WatchMate Educational Content Initiative",
            license: "CC-BY-4.0",
            permissionEvidence: "Self-authored educational script and open curriculum baseline",
            attribution: "WatchMate AI Educational Archive",
            redistributionTerms: "Permitted for redistribution and educational AI assistance demonstration",
            status: "pending_media",
        };
        const parsed = RightsRecordSchema.safeParse(rights);
        assert.equal(parsed.success, true);
    });
});
//# sourceMappingURL=contracts.test.js.map