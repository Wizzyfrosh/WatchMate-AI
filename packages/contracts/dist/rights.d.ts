import { z } from "zod";
export declare const RightsRecordSchema: z.ZodObject<{
    rightsId: z.ZodString;
    title: z.ZodString;
    sourceUrl: z.ZodString;
    owner: z.ZodString;
    license: z.ZodString;
    permissionEvidence: z.ZodString;
    attribution: z.ZodString;
    redistributionTerms: z.ZodString;
    status: z.ZodEnum<["approved", "pending_media", "test_fixture"]>;
}, "strip", z.ZodTypeAny, {
    title: string;
    rightsId: string;
    status: "approved" | "pending_media" | "test_fixture";
    sourceUrl: string;
    owner: string;
    license: string;
    permissionEvidence: string;
    attribution: string;
    redistributionTerms: string;
}, {
    title: string;
    rightsId: string;
    status: "approved" | "pending_media" | "test_fixture";
    sourceUrl: string;
    owner: string;
    license: string;
    permissionEvidence: string;
    attribution: string;
    redistributionTerms: string;
}>;
export type RightsRecord = z.infer<typeof RightsRecordSchema>;
export declare const RightsCatalogSchema: z.ZodArray<z.ZodObject<{
    rightsId: z.ZodString;
    title: z.ZodString;
    sourceUrl: z.ZodString;
    owner: z.ZodString;
    license: z.ZodString;
    permissionEvidence: z.ZodString;
    attribution: z.ZodString;
    redistributionTerms: z.ZodString;
    status: z.ZodEnum<["approved", "pending_media", "test_fixture"]>;
}, "strip", z.ZodTypeAny, {
    title: string;
    rightsId: string;
    status: "approved" | "pending_media" | "test_fixture";
    sourceUrl: string;
    owner: string;
    license: string;
    permissionEvidence: string;
    attribution: string;
    redistributionTerms: string;
}, {
    title: string;
    rightsId: string;
    status: "approved" | "pending_media" | "test_fixture";
    sourceUrl: string;
    owner: string;
    license: string;
    permissionEvidence: string;
    attribution: string;
    redistributionTerms: string;
}>, "many">;
export type RightsCatalog = z.infer<typeof RightsCatalogSchema>;
//# sourceMappingURL=rights.d.ts.map