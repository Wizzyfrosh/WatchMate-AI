import { z } from "zod";
export declare const SegmentSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    startMs: z.ZodNumber;
    endMs: z.ZodNumber;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    startMs: number;
    endMs: number;
    text: string;
}, {
    id: string;
    startMs: number;
    endMs: number;
    text: string;
}>, {
    id: string;
    startMs: number;
    endMs: number;
    text: string;
}, {
    id: string;
    startMs: number;
    endMs: number;
    text: string;
}>;
export type Segment = z.infer<typeof SegmentSchema>;
export declare const TranscriptSchema: z.ZodEffects<z.ZodObject<{
    videoId: z.ZodString;
    transcriptVersion: z.ZodString;
    durationMs: z.ZodNumber;
    segments: z.ZodArray<z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        startMs: z.ZodNumber;
        endMs: z.ZodNumber;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }, {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }>, {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }, {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    durationMs: number;
    transcriptVersion: string;
    videoId: string;
    segments: {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }[];
}, {
    durationMs: number;
    transcriptVersion: string;
    videoId: string;
    segments: {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }[];
}>, {
    durationMs: number;
    transcriptVersion: string;
    videoId: string;
    segments: {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }[];
}, {
    durationMs: number;
    transcriptVersion: string;
    videoId: string;
    segments: {
        id: string;
        startMs: number;
        endMs: number;
        text: string;
    }[];
}>;
export type Transcript = z.infer<typeof TranscriptSchema>;
//# sourceMappingURL=transcript.d.ts.map