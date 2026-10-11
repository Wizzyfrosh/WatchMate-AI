import { z } from "zod";
export declare const VideoRecordSchema: z.ZodObject<{
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
}>;
export type VideoRecord = z.infer<typeof VideoRecordSchema>;
export declare const CatalogSchema: z.ZodEffects<z.ZodArray<z.ZodObject<{
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
}>, "many">, {
    id: string;
    title: string;
    durationMs: number;
    description: string;
    mediaKey: string;
    captionsKey: string;
    transcriptVersion: string;
    rightsId: string;
    thumbnailKey?: string | undefined;
}[], {
    id: string;
    title: string;
    durationMs: number;
    description: string;
    mediaKey: string;
    captionsKey: string;
    transcriptVersion: string;
    rightsId: string;
    thumbnailKey?: string | undefined;
}[]>;
export type Catalog = z.infer<typeof CatalogSchema>;
//# sourceMappingURL=catalog.d.ts.map