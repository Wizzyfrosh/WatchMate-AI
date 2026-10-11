import { z } from "zod";
import type { Transcript } from "./transcript.js";
export declare const SourceReferenceSchema: z.ZodObject<{
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
}>;
export type SourceReference = z.infer<typeof SourceReferenceSchema>;
/**
 * Resolves source IDs against the trusted server transcript.
 * Throws an Error if any unknown source ID is provided, preventing untrusted citations.
 */
export declare function resolveSourceReferences(sourceIds: string[], transcript: Transcript): SourceReference[];
//# sourceMappingURL=source.d.ts.map