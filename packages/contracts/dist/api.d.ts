import { z } from "zod";
export declare const HealthResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"ok">;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "ok";
    timestamp?: string | undefined;
}, {
    status: "ok";
    timestamp?: string | undefined;
}>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export declare const VideoListResponseSchema: z.ZodObject<{
    videos: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        durationMs: z.ZodNumber;
        description: z.ZodString;
        mediaKey: z.ZodString;
        captionsKey: z.ZodString;
        transcriptVersion: z.ZodString;
        rightsId: z.ZodString;
        thumbnailKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        durationMs: number;
        description: string;
        mediaKey: string;
        captionsKey: string;
        transcriptVersion: string;
        rightsId: string;
        thumbnailKey?: string | undefined;
    }, {
        id: string;
        title: string;
        durationMs: number;
        description: string;
        mediaKey: string;
        captionsKey: string;
        transcriptVersion: string;
        rightsId: string;
        thumbnailKey?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    videos: {
        id: string;
        title: string;
        durationMs: number;
        description: string;
        mediaKey: string;
        captionsKey: string;
        transcriptVersion: string;
        rightsId: string;
        thumbnailKey?: string | undefined;
    }[];
}, {
    videos: {
        id: string;
        title: string;
        durationMs: number;
        description: string;
        mediaKey: string;
        captionsKey: string;
        transcriptVersion: string;
        rightsId: string;
        thumbnailKey?: string | undefined;
    }[];
}>;
export type VideoListResponse = z.infer<typeof VideoListResponseSchema>;
export declare const VideoDetailResponseSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    durationMs: z.ZodNumber;
    description: z.ZodString;
    mediaKey: z.ZodString;
    captionsKey: z.ZodString;
    transcriptVersion: z.ZodString;
    rightsId: z.ZodString;
    thumbnailKey: z.ZodOptional<z.ZodString>;
} & {
    mediaUrl: z.ZodOptional<z.ZodString>;
    captionsUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    durationMs: number;
    description: string;
    mediaKey: string;
    captionsKey: string;
    transcriptVersion: string;
    rightsId: string;
    thumbnailKey?: string | undefined;
    mediaUrl?: string | undefined;
    captionsUrl?: string | undefined;
}, {
    id: string;
    title: string;
    durationMs: number;
    description: string;
    mediaKey: string;
    captionsKey: string;
    transcriptVersion: string;
    rightsId: string;
    thumbnailKey?: string | undefined;
    mediaUrl?: string | undefined;
    captionsUrl?: string | undefined;
}>;
export type VideoDetailResponse = z.infer<typeof VideoDetailResponseSchema>;
export declare const AssistActionSchema: z.ZodEnum<["explain", "catch_up"]>;
export type AssistAction = z.infer<typeof AssistActionSchema>;
export declare const AssistDetailSchema: z.ZodEnum<["standard", "simple"]>;
export type AssistDetail = z.infer<typeof AssistDetailSchema>;
export declare const AssistRequestSchema: z.ZodObject<{
    videoId: z.ZodString;
    transcriptVersion: z.ZodString;
    action: z.ZodEnum<["explain", "catch_up"]>;
    playheadMs: z.ZodNumber;
    watchedRanges: z.ZodArray<z.ZodEffects<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, [number, number], [number, number]>, "many">;
    detail: z.ZodDefault<z.ZodEnum<["standard", "simple"]>>;
    requestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transcriptVersion: string;
    videoId: string;
    action: "explain" | "catch_up";
    playheadMs: number;
    watchedRanges: [number, number][];
    detail: "standard" | "simple";
    requestId: string;
}, {
    transcriptVersion: string;
    videoId: string;
    action: "explain" | "catch_up";
    playheadMs: number;
    watchedRanges: [number, number][];
    requestId: string;
    detail?: "standard" | "simple" | undefined;
}>;
export type AssistRequest = z.infer<typeof AssistRequestSchema>;
export declare const AssistResponseSchema: z.ZodEffects<z.ZodObject<{
    status: z.ZodEnum<["ok", "insufficient_evidence"]>;
    requestId: z.ZodString;
    videoId: z.ZodString;
    transcriptVersion: z.ZodString;
    action: z.ZodEnum<["explain", "catch_up"]>;
    text: z.ZodOptional<z.ZodString>;
    sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
        segmentId: z.ZodString;
        startMs: z.ZodNumber;
        endMs: z.ZodNumber;
        text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startMs: number;
        endMs: number;
        segmentId: string;
        text?: string | undefined;
    }, {
        startMs: number;
        endMs: number;
        segmentId: string;
        text?: string | undefined;
    }>, "many">>;
    evidenceHash: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    transcriptVersion: string;
    status: "ok" | "insufficient_evidence";
    videoId: string;
    action: "explain" | "catch_up";
    requestId: string;
    sources: {
        startMs: number;
        endMs: number;
        segmentId: string;
        text?: string | undefined;
    }[];
    message?: string | undefined;
    text?: string | undefined;
    evidenceHash?: string | undefined;
}, {
    transcriptVersion: string;
    status: "ok" | "insufficient_evidence";
    videoId: string;
    action: "explain" | "catch_up";
    requestId: string;
    message?: string | undefined;
    text?: string | undefined;
    sources?: {
        startMs: number;
        endMs: number;
        segmentId: string;
        text?: string | undefined;
    }[] | undefined;
    evidenceHash?: string | undefined;
}>, {
    transcriptVersion: string;
    status: "ok" | "insufficient_evidence";
    videoId: string;
    action: "explain" | "catch_up";
    requestId: string;
    sources: {
        startMs: number;
        endMs: number;
        segmentId: string;
        text?: string | undefined;
    }[];
    message?: string | undefined;
    text?: string | undefined;
    evidenceHash?: string | undefined;
}, {
    transcriptVersion: string;
    status: "ok" | "insufficient_evidence";
    videoId: string;
    action: "explain" | "catch_up";
    requestId: string;
    message?: string | undefined;
    text?: string | undefined;
    sources?: {
        startMs: number;
        endMs: number;
        segmentId: string;
        text?: string | undefined;
    }[] | undefined;
    evidenceHash?: string | undefined;
}>;
export type AssistResponse = z.infer<typeof AssistResponseSchema>;
export declare const QuizRequestSchema: z.ZodObject<{
    videoId: z.ZodString;
    transcriptVersion: z.ZodString;
    playheadMs: z.ZodNumber;
    watchedRanges: z.ZodArray<z.ZodEffects<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, [number, number], [number, number]>, "many">;
    requestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transcriptVersion: string;
    videoId: string;
    playheadMs: number;
    watchedRanges: [number, number][];
    requestId: string;
}, {
    transcriptVersion: string;
    videoId: string;
    playheadMs: number;
    watchedRanges: [number, number][];
    requestId: string;
}>;
export type QuizRequest = z.infer<typeof QuizRequestSchema>;
export declare const QuizOptionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
}, {
    id: string;
    text: string;
}>;
export type QuizOption = z.infer<typeof QuizOptionSchema>;
export declare const QuizQuestionSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    prompt: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
    }, {
        id: string;
        text: string;
    }>, "many">;
    correctOptionId: z.ZodString;
    explanation: z.ZodString;
    sourceIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    options: {
        id: string;
        text: string;
    }[];
    prompt: string;
    correctOptionId: string;
    explanation: string;
    sourceIds: string[];
}, {
    id: string;
    options: {
        id: string;
        text: string;
    }[];
    prompt: string;
    correctOptionId: string;
    explanation: string;
    sourceIds: string[];
}>, {
    id: string;
    options: {
        id: string;
        text: string;
    }[];
    prompt: string;
    correctOptionId: string;
    explanation: string;
    sourceIds: string[];
}, {
    id: string;
    options: {
        id: string;
        text: string;
    }[];
    prompt: string;
    correctOptionId: string;
    explanation: string;
    sourceIds: string[];
}>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export declare const QuizResponseSchema: z.ZodEffects<z.ZodObject<{
    status: z.ZodEnum<["ok", "insufficient_evidence"]>;
    quizId: z.ZodString;
    videoId: z.ZodString;
    questions: z.ZodDefault<z.ZodArray<z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        prompt: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
        }, {
            id: string;
            text: string;
        }>, "many">;
        correctOptionId: z.ZodString;
        explanation: z.ZodString;
        sourceIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }, {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }>, {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }, {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }>, "many">>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "ok" | "insufficient_evidence";
    videoId: string;
    quizId: string;
    questions: {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }[];
    message?: string | undefined;
}, {
    status: "ok" | "insufficient_evidence";
    videoId: string;
    quizId: string;
    message?: string | undefined;
    questions?: {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }[] | undefined;
}>, {
    status: "ok" | "insufficient_evidence";
    videoId: string;
    quizId: string;
    questions: {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }[];
    message?: string | undefined;
}, {
    status: "ok" | "insufficient_evidence";
    videoId: string;
    quizId: string;
    message?: string | undefined;
    questions?: {
        id: string;
        options: {
            id: string;
            text: string;
        }[];
        prompt: string;
        correctOptionId: string;
        explanation: string;
        sourceIds: string[];
    }[] | undefined;
}>;
export type QuizResponse = z.infer<typeof QuizResponseSchema>;
export declare const ErrorResponseSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    correlationId: z.ZodString;
    retryable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    correlationId: string;
    retryable: boolean;
}, {
    code: string;
    message: string;
    correlationId: string;
    retryable: boolean;
}>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
//# sourceMappingURL=api.d.ts.map