import type { FastifyPluginAsync } from "fastify";
import type { LoadedContent } from "../content-loader.js";
import {
  AssistRequestSchema,
  normalizeWatchedRanges,
  selectExplainSegments,
  selectEligibleSegments,
  resolveSourceReferences,
  type AssistResponse,
  type ErrorResponse,
} from "@watchmate/contracts";
import {
  type AiProvider,
  createAiProvider,
  BedrockError,
} from "../bedrock.js";

export const assistRoutes = (
  content: LoadedContent,
  aiProvider: AiProvider = createAiProvider()
): FastifyPluginAsync => {
  return async (fastify) => {
    fastify.post("/v1/assist", async (request, reply) => {
      const correlationId = (request as any).correlationId;

      const parsed = AssistRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        const errorResponse: ErrorResponse = {
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
        const errorResponse: ErrorResponse = {
          code: "VIDEO_NOT_FOUND",
          message: `Unknown video ID "${req.videoId}"`,
          correlationId,
          retryable: false,
        };
        return reply.status(404).send(errorResponse);
      }

      if (video.transcriptVersion !== req.transcriptVersion) {
        const errorResponse: ErrorResponse = {
          code: "CONTENT_VERSION_CONFLICT",
          message: `Transcript version mismatch. Server has "${video.transcriptVersion}", requested "${req.transcriptVersion}"`,
          correlationId,
          retryable: false,
        };
        return reply.status(409).send(errorResponse);
      }

      const transcript = content.transcriptMap.get(req.videoId);
      if (!transcript) {
        const errorResponse: ErrorResponse = {
          code: "TRANSCRIPT_NOT_FOUND",
          message: `Transcript not available for video "${req.videoId}"`,
          correlationId,
          retryable: false,
        };
        return reply.status(503).send(errorResponse);
      }

      // Evidence selection algorithm (PRD Section 11)
      const normalizedRanges = normalizeWatchedRanges(
        req.watchedRanges,
        req.playheadMs
      );
      const eligibleSegments =
        req.action === "explain"
          ? selectExplainSegments(
              transcript.segments,
              normalizedRanges,
              req.playheadMs
            )
          : selectEligibleSegments(transcript.segments, normalizedRanges);

      if (eligibleSegments.length === 0) {
        const insufficientResponse: AssistResponse = {
          status: "insufficient_evidence",
          requestId: req.requestId,
          videoId: req.videoId,
          transcriptVersion: req.transcriptVersion,
          action: req.action,
          sources: [],
          message:
            req.action === "catch_up"
              ? "Watch more of the lesson before requesting a catch-up summary."
              : "Watch more of the lesson before requesting an explanation.",
        };
        return reply.status(200).send(insufficientResponse);
      }

      try {
        const result =
          req.action === "catch_up"
            ? await aiProvider.generateCatchUp({
                videoId: req.videoId,
                segments: eligibleSegments,
                playheadMs: req.playheadMs,
              })
            : await aiProvider.generateExplanation({
                videoId: req.videoId,
                detail: req.detail,
                segments: eligibleSegments,
                playheadMs: req.playheadMs,
              });

        // Resolve source timestamps on the server using trusted transcript (PRD §11)
        const resolvedSources = resolveSourceReferences(
          result.citedSegmentIds,
          transcript
        );

        const response: AssistResponse = {
          status: "ok",
          requestId: req.requestId,
          videoId: req.videoId,
          transcriptVersion: req.transcriptVersion,
          action: req.action,
          text: result.text,
          sources: resolvedSources,
        };

        return reply.status(200).send(response);
      } catch (err: any) {
        if (err instanceof BedrockError) {
          if (err.code === "GENERATION_TIMEOUT") {
            const errorResponse: ErrorResponse = {
              code: "GENERATION_TIMEOUT",
              message: "Generation timed out. Please try again.",
              correlationId,
              retryable: true,
            };
            return reply.status(504).send(errorResponse);
          }
          if (
            err.code === "INVALID_MODEL_OUTPUT" ||
            err.code === "INVALID_CITATION"
          ) {
            const errorResponse: ErrorResponse = {
              code: "INVALID_MODEL_OUTPUT",
              message:
                "The model returned an invalid result or ungrounded citation.",
              correlationId,
              retryable: false,
            };
            return reply.status(502).send(errorResponse);
          }
        }

        const errorResponse: ErrorResponse = {
          code: "SERVICE_UNAVAILABLE",
          message: "The AI service is temporarily unavailable. You can continue watching.",
          correlationId,
          retryable: true,
        };
        return reply.status(503).send(errorResponse);
      }
    });
  };
};
