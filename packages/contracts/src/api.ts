import { z } from "zod";
import { VideoRecordSchema } from "./catalog.js";
import { WatchedRangesListSchema } from "./evidence.js";
import { SourceReferenceSchema } from "./source.js";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string().optional(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const VideoListResponseSchema = z.object({
  videos: z.array(VideoRecordSchema),
});
export type VideoListResponse = z.infer<typeof VideoListResponseSchema>;

export const VideoDetailResponseSchema = VideoRecordSchema.extend({
  mediaUrl: z.string().optional(),
  captionsUrl: z.string().optional(),
});
export type VideoDetailResponse = z.infer<typeof VideoDetailResponseSchema>;

export const AssistActionSchema = z.enum(["explain", "catch_up"]);
export type AssistAction = z.infer<typeof AssistActionSchema>;

export const AssistDetailSchema = z.enum(["standard", "simple"]);
export type AssistDetail = z.infer<typeof AssistDetailSchema>;

export const AssistRequestSchema = z.object({
  videoId: z.string().min(1),
  transcriptVersion: z.string().min(1),
  action: AssistActionSchema,
  playheadMs: z.number().int().min(0),
  watchedRanges: WatchedRangesListSchema,
  detail: AssistDetailSchema.default("standard"),
  requestId: z.string().min(1),
});
export type AssistRequest = z.infer<typeof AssistRequestSchema>;

export const AssistResponseSchema = z.object({
  status: z.enum(["ok", "insufficient_evidence"]),
  requestId: z.string().min(1),
  videoId: z.string().min(1),
  transcriptVersion: z.string().min(1),
  action: AssistActionSchema,
  text: z.string().optional(),
  sources: z.array(SourceReferenceSchema).default([]),
  evidenceHash: z.string().optional(),
  message: z.string().optional(),
}).refine(
  (res) => {
    if (res.status === "ok") {
      return typeof res.text === "string" && res.text.length > 0;
    }
    return true;
  },
  { message: "Successful assist response must include non-empty text" }
);
export type AssistResponse = z.infer<typeof AssistResponseSchema>;

export const QuizRequestSchema = z.object({
  videoId: z.string().min(1),
  transcriptVersion: z.string().min(1),
  playheadMs: z.number().int().min(0),
  watchedRanges: WatchedRangesListSchema,
  requestId: z.string().min(1),
});
export type QuizRequest = z.infer<typeof QuizRequestSchema>;

export const QuizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});
export type QuizOption = z.infer<typeof QuizOptionSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(QuizOptionSchema).min(3).max(4),
  correctOptionId: z.string().min(1),
  explanation: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
}).superRefine((q, ctx) => {
  const ids = new Set(q.options.map((o) => o.id));
  if (ids.size !== q.options.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Quiz question options must have unique IDs",
      path: ["options"],
    });
  }
  if (!ids.has(q.correctOptionId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `correctOptionId "${q.correctOptionId}" must match one of the option IDs`,
      path: ["correctOptionId"],
    });
  }
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizResponseSchema = z.object({
  status: z.enum(["ok", "insufficient_evidence"]),
  quizId: z.string().min(1),
  videoId: z.string().min(1),
  questions: z.array(QuizQuestionSchema).default([]),
  message: z.string().optional(),
}).refine(
  (res) => {
    if (res.status === "ok") {
      return res.questions.length === 3;
    }
    return true;
  },
  { message: "Successful quiz must contain exactly 3 questions" }
);
export type QuizResponse = z.infer<typeof QuizResponseSchema>;

export const ErrorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  correlationId: z.string().min(1),
  retryable: z.boolean(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
