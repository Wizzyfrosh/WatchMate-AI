export interface SegmentInput {
    id: string;
    startMs: number;
    endMs: number;
    text: string;
}
export interface ExplainParams {
    videoId: string;
    detail: "standard" | "simple";
    segments: SegmentInput[];
    playheadMs: number;
}
export interface ExplainResult {
    text: string;
    citedSegmentIds: string[];
}
export interface CatchUpParams {
    videoId: string;
    segments: SegmentInput[];
    playheadMs: number;
}
export interface QuizParams {
    videoId: string;
    segments: SegmentInput[];
    playheadMs: number;
}
export interface QuizOption {
    id: string;
    text: string;
}
export interface QuizQuestionResult {
    id: string;
    prompt: string;
    options: QuizOption[];
    correctOptionId: string;
    explanation: string;
    sourceIds: string[];
}
export interface QuizResult {
    questions: QuizQuestionResult[];
}
export interface AiProvider {
    generateExplanation(params: ExplainParams): Promise<ExplainResult>;
    generateCatchUp(params: CatchUpParams): Promise<ExplainResult>;
    generateQuiz(params: QuizParams): Promise<QuizResult>;
}
export declare class BedrockError extends Error {
    readonly code: "GENERATION_TIMEOUT" | "INVALID_MODEL_OUTPUT" | "INVALID_CITATION" | "SERVICE_UNAVAILABLE";
    readonly retryable: boolean;
    constructor(code: "GENERATION_TIMEOUT" | "INVALID_MODEL_OUTPUT" | "INVALID_CITATION" | "SERVICE_UNAVAILABLE", message: string, retryable?: boolean);
}
/**
 * Validates raw model output text into ExplainResult.
 * Enforces JSON structure, non-empty text, and strict citation allowlisting.
 */
export declare function parseAndValidateModelOutput(rawOutput: string, allowedSegmentIds: Set<string>): ExplainResult;
/**
 * Validates raw model output text into QuizResult (PRD Section 10 & 11).
 * Enforces exactly 3 questions, 3-4 options per question, unique option IDs,
 * valid correctOptionId, and strictly allowlisted source IDs.
 */
export declare function parseAndValidateQuizOutput(rawOutput: string, allowedSegmentIds: Set<string>): QuizResult;
export declare class BedrockConverseProvider implements AiProvider {
    private client;
    private modelId;
    private timeoutMs;
    constructor(options?: {
        region?: string;
        modelId?: string;
        timeoutMs?: number;
    });
    generateExplanation(params: ExplainParams): Promise<ExplainResult>;
    generateCatchUp(params: CatchUpParams): Promise<ExplainResult>;
    generateQuiz(params: QuizParams): Promise<QuizResult>;
    private invokeConverse;
}
/**
 * Deterministic Mock AI Provider for local development, CI, and test execution.
 */
export declare class MockAiProvider implements AiProvider {
    private failureMode?;
    constructor(failureMode?: "timeout" | "malformed_json" | "invalid_citation" | undefined);
    generateExplanation(params: ExplainParams): Promise<ExplainResult>;
    generateCatchUp(params: CatchUpParams): Promise<ExplainResult>;
    generateQuiz(params: QuizParams): Promise<QuizResult>;
    private checkFailures;
}
export declare function createAiProvider(): AiProvider;
//# sourceMappingURL=bedrock.d.ts.map