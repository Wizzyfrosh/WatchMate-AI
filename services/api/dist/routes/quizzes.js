import { QuizRequestSchema, normalizeWatchedRanges, selectEligibleSegments, } from "@watchmate/contracts";
import { createAiProvider, BedrockError, } from "../bedrock.js";
export const quizRoutes = (content, aiProvider = createAiProvider()) => {
    return async (fastify) => {
        fastify.post("/v1/quizzes", async (request, reply) => {
            const correlationId = request.correlationId;
            const parsed = QuizRequestSchema.safeParse(request.body);
            if (!parsed.success) {
                const errorResponse = {
                    code: "INVALID_REQUEST_BODY",
                    message: parsed.error.issues
                        .map((i) => `${i.path.join(".")}: ${i.message}`)
                        .join("; "),
                    correlationId,
                    retryable: false,
                };
                return reply.status(400).send(errorResponse);
            }
            const req = parsed.data;
            const video = content.videoMap.get(req.videoId);
            if (!video) {
                const errorResponse = {
                    code: "VIDEO_NOT_FOUND",
                    message: `Unknown video ID "${req.videoId}"`,
                    correlationId,
                    retryable: false,
                };
                return reply.status(404).send(errorResponse);
            }
            if (video.transcriptVersion !== req.transcriptVersion) {
                const errorResponse = {
                    code: "CONTENT_VERSION_CONFLICT",
                    message: `Transcript version mismatch. Server has "${video.transcriptVersion}", requested "${req.transcriptVersion}"`,
                    correlationId,
                    retryable: false,
                };
                return reply.status(409).send(errorResponse);
            }
            const transcript = content.transcriptMap.get(req.videoId);
            if (!transcript) {
                const errorResponse = {
                    code: "TRANSCRIPT_NOT_FOUND",
                    message: `Transcript not available for video "${req.videoId}"`,
                    correlationId,
                    retryable: false,
                };
                return reply.status(503).send(errorResponse);
            }
            const normalizedRanges = normalizeWatchedRanges(req.watchedRanges, req.playheadMs);
            const eligibleSegments = selectEligibleSegments(transcript.segments, normalizedRanges);
            // Need at least 3 eligible segments to produce a grounded 3-question quiz (PRD FR07)
            if (eligibleSegments.length < 3) {
                const insufficientResponse = {
                    status: "insufficient_evidence",
                    quizId: `quiz-${req.requestId}`,
                    videoId: req.videoId,
                    questions: [],
                    message: "Watch more of the lesson before taking a quiz.",
                };
                return reply.status(200).send(insufficientResponse);
            }
            try {
                const quizResult = await aiProvider.generateQuiz({
                    videoId: req.videoId,
                    segments: eligibleSegments,
                    playheadMs: req.playheadMs,
                });
                const response = {
                    status: "ok",
                    quizId: `quiz-${req.requestId}`,
                    videoId: req.videoId,
                    questions: quizResult.questions,
                };
                return reply.status(200).send(response);
            }
            catch (err) {
                if (err instanceof BedrockError) {
                    if (err.code === "GENERATION_TIMEOUT") {
                        const errorResponse = {
                            code: "GENERATION_TIMEOUT",
                            message: "Quiz generation timed out. Please try again.",
                            correlationId,
                            retryable: true,
                        };
                        return reply.status(504).send(errorResponse);
                    }
                    if (err.code === "INVALID_MODEL_OUTPUT" ||
                        err.code === "INVALID_CITATION") {
                        const errorResponse = {
                            code: "INVALID_MODEL_OUTPUT",
                            message: "The model returned an invalid quiz structure.",
                            correlationId,
                            retryable: false,
                        };
                        return reply.status(502).send(errorResponse);
                    }
                }
                const errorResponse = {
                    code: "SERVICE_UNAVAILABLE",
                    message: "The AI quiz service is temporarily unavailable.",
                    correlationId,
                    retryable: true,
                };
                return reply.status(503).send(errorResponse);
            }
        });
    };
};
//# sourceMappingURL=quizzes.js.map