import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAndValidateModelOutput, parseAndValidateQuizOutput, MockAiProvider, BedrockError, } from "./bedrock.js";
describe("Bedrock Model Output Parsing and Validation", () => {
    const allowed = new Set(["seg-001", "seg-002", "seg-003"]);
    it("parses and validates clean JSON with approved citations", () => {
        const raw = JSON.stringify({
            text: "The sun is a G-type main sequence star.",
            citedSegmentIds: ["seg-001", "seg-002"],
        });
        const result = parseAndValidateModelOutput(raw, allowed);
        assert.equal(result.text, "The sun is a G-type main sequence star.");
        assert.deepEqual(result.citedSegmentIds, ["seg-001", "seg-002"]);
    });
    it("strips markdown code fences from model response", () => {
        const raw = "```json\n" +
            JSON.stringify({
                text: "Mercury is heavily cratered with little atmosphere.",
                citedSegmentIds: ["seg-003"],
            }) +
            "\n```";
        const result = parseAndValidateModelOutput(raw, allowed);
        assert.equal(result.text, "Mercury is heavily cratered with little atmosphere.");
        assert.deepEqual(result.citedSegmentIds, ["seg-003"]);
    });
    it("rejects malformed JSON", () => {
        assert.throws(() => parseAndValidateModelOutput("This is plain text, not JSON.", allowed), (err) => err instanceof BedrockError && err.code === "INVALID_MODEL_OUTPUT");
    });
    it("rejects response missing text or with empty text", () => {
        const missingText = JSON.stringify({ citedSegmentIds: ["seg-001"] });
        assert.throws(() => parseAndValidateModelOutput(missingText, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_MODEL_OUTPUT");
        const emptyText = JSON.stringify({ text: "   ", citedSegmentIds: ["seg-001"] });
        assert.throws(() => parseAndValidateModelOutput(emptyText, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_MODEL_OUTPUT");
    });
    it("rejects response missing citedSegmentIds or with empty array", () => {
        const missingCitations = JSON.stringify({ text: "Hello" });
        assert.throws(() => parseAndValidateModelOutput(missingCitations, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_MODEL_OUTPUT");
        const emptyCitations = JSON.stringify({ text: "Hello", citedSegmentIds: [] });
        assert.throws(() => parseAndValidateModelOutput(emptyCitations, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_MODEL_OUTPUT");
    });
    it("rejects response containing URLs or web links", () => {
        const withUrl = JSON.stringify({
            text: "Check out https://nasa.gov for more details.",
            citedSegmentIds: ["seg-001"],
        });
        assert.throws(() => parseAndValidateModelOutput(withUrl, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_MODEL_OUTPUT");
    });
    it("strictly rejects citation of segment IDs not in the allowed evidence set", () => {
        const unapproved = JSON.stringify({
            text: "Jupiter has a Great Red Spot.",
            citedSegmentIds: ["seg-008"], // not in allowed set of [seg-001, seg-002, seg-003]
        });
        assert.throws(() => parseAndValidateModelOutput(unapproved, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_CITATION");
    });
});
describe("Bedrock Quiz Output Validation", () => {
    const allowed = new Set(["seg-001", "seg-002", "seg-003"]);
    it("parses and validates compliant 3-question quiz", () => {
        const raw = JSON.stringify({
            questions: [
                {
                    id: "q-1",
                    prompt: "What star is at the center?",
                    options: [
                        { id: "opt-1", text: "The Sun" },
                        { id: "opt-2", text: "Proxima Centauri" },
                        { id: "opt-3", text: "Sirius" },
                    ],
                    correctOptionId: "opt-1",
                    explanation: "The Sun is at the center.",
                    sourceIds: ["seg-001"],
                },
                {
                    id: "q-2",
                    prompt: "What are terrestrial planets made of?",
                    options: [
                        { id: "opt-a", text: "Gas and ice" },
                        { id: "opt-b", text: "Rock and metal" },
                        { id: "opt-c", text: "Liquid hydrogen" },
                    ],
                    correctOptionId: "opt-b",
                    explanation: "They are composed of rock and metal.",
                    sourceIds: ["seg-002"],
                },
                {
                    id: "q-3",
                    prompt: "Which planet is heavily cratered?",
                    options: [
                        { id: "opt-x", text: "Mercury" },
                        { id: "opt-y", text: "Venus" },
                        { id: "opt-z", text: "Earth" },
                    ],
                    correctOptionId: "opt-x",
                    explanation: "Mercury is heavily cratered.",
                    sourceIds: ["seg-003"],
                },
            ],
        });
        const res = parseAndValidateQuizOutput(raw, allowed);
        assert.equal(res.questions.length, 3);
        assert.equal(res.questions[0].correctOptionId, "opt-1");
        assert.deepEqual(res.questions[0].sourceIds, ["seg-001"]);
    });
    it("rejects quiz with fewer than 3 questions", () => {
        const raw = JSON.stringify({ questions: [] });
        assert.throws(() => parseAndValidateQuizOutput(raw, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_MODEL_OUTPUT");
    });
    it("rejects quiz with unapproved source citations", () => {
        const raw = JSON.stringify({
            questions: [
                {
                    id: "q-1",
                    prompt: "Question 1",
                    options: [
                        { id: "opt-1", text: "Option 1" },
                        { id: "opt-2", text: "Option 2" },
                        { id: "opt-3", text: "Option 3" },
                    ],
                    correctOptionId: "opt-1",
                    sourceIds: ["seg-unknown"], // Not in allowed set
                },
                {
                    id: "q-2",
                    prompt: "Question 2",
                    options: [
                        { id: "opt-1", text: "Option 1" },
                        { id: "opt-2", text: "Option 2" },
                        { id: "opt-3", text: "Option 3" },
                    ],
                    correctOptionId: "opt-1",
                    sourceIds: ["seg-002"],
                },
                {
                    id: "q-3",
                    prompt: "Question 3",
                    options: [
                        { id: "opt-1", text: "Option 1" },
                        { id: "opt-2", text: "Option 2" },
                        { id: "opt-3", text: "Option 3" },
                    ],
                    correctOptionId: "opt-1",
                    sourceIds: ["seg-003"],
                },
            ],
        });
        assert.throws(() => parseAndValidateQuizOutput(raw, allowed), (err) => err instanceof BedrockError && err.code === "INVALID_CITATION");
    });
});
describe("MockAiProvider", () => {
    const segments = [
        { id: "seg-001", startMs: 0, endMs: 10000, text: "Introduction to planets." },
        { id: "seg-002", startMs: 10000, endMs: 20000, text: "The sun is central." },
        { id: "seg-003", startMs: 20000, endMs: 30000, text: "Rocky planets are solid." },
    ];
    it("generates standard explanation with eligible citations", async () => {
        const provider = new MockAiProvider();
        const result = await provider.generateExplanation({
            videoId: "lesson-01",
            detail: "standard",
            segments,
            playheadMs: 15000,
        });
        assert.ok(result.text.includes("Explanation:"));
        assert.deepEqual(result.citedSegmentIds, ["seg-002", "seg-003"]);
    });
    it("generates simple explanation with everyday language", async () => {
        const provider = new MockAiProvider();
        const result = await provider.generateExplanation({
            videoId: "lesson-01",
            detail: "simple",
            segments,
            playheadMs: 15000,
        });
        assert.ok(result.text.includes("Simply put:"));
        assert.deepEqual(result.citedSegmentIds, ["seg-002", "seg-003"]);
    });
    it("generates catch-up summary covering watched segments", async () => {
        const provider = new MockAiProvider();
        const result = await provider.generateCatchUp({
            videoId: "lesson-01",
            segments,
            playheadMs: 25000,
        });
        assert.ok(result.text.includes("So far:"));
        assert.deepEqual(result.citedSegmentIds, ["seg-001", "seg-002", "seg-003"]);
    });
    it("generates 3-question grounded quiz", async () => {
        const provider = new MockAiProvider();
        const result = await provider.generateQuiz({
            videoId: "lesson-01",
            segments,
            playheadMs: 25000,
        });
        assert.equal(result.questions.length, 3);
        for (const q of result.questions) {
            assert.ok(q.options.length >= 3);
            assert.ok(q.options.some((o) => o.id === q.correctOptionId));
            assert.ok(q.sourceIds.length > 0);
        }
    });
    it("handles timeout failure mode", async () => {
        const provider = new MockAiProvider("timeout");
        await assert.rejects(async () => {
            await provider.generateExplanation({
                videoId: "lesson-01",
                detail: "standard",
                segments,
                playheadMs: 15000,
            });
        }, (err) => err instanceof BedrockError && err.code === "GENERATION_TIMEOUT");
    });
    it("handles invalid citation failure mode", async () => {
        const provider = new MockAiProvider("invalid_citation");
        await assert.rejects(async () => {
            await provider.generateExplanation({
                videoId: "lesson-01",
                detail: "standard",
                segments,
                playheadMs: 15000,
            });
        }, (err) => err instanceof BedrockError && err.code === "INVALID_CITATION");
    });
});
//# sourceMappingURL=bedrock.test.js.map