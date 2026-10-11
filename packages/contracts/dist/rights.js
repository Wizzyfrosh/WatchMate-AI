import { z } from "zod";
export const RightsRecordSchema = z.object({
    rightsId: z.string().min(1),
    title: z.string().min(1),
    sourceUrl: z.string().min(1),
    owner: z.string().min(1),
    license: z.string().min(1),
    permissionEvidence: z.string().min(1),
    attribution: z.string().min(1),
    redistributionTerms: z.string().min(1),
    status: z.enum(["approved", "pending_media", "test_fixture"]),
});
export const RightsCatalogSchema = z.array(RightsRecordSchema);
//# sourceMappingURL=rights.js.map