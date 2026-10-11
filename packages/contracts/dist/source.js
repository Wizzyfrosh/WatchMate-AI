import { z } from "zod";
export const SourceReferenceSchema = z.object({
    segmentId: z.string().min(1),
    startMs: z.number().int().min(0),
    endMs: z.number().int().positive(),
    text: z.string().optional(),
});
/**
 * Resolves source IDs against the trusted server transcript.
 * Throws an Error if any unknown source ID is provided, preventing untrusted citations.
 */
export function resolveSourceReferences(sourceIds, transcript) {
    const segmentMap = new Map(transcript.segments.map((seg) => [seg.id, seg]));
    const resolved = [];
    for (const id of sourceIds) {
        const seg = segmentMap.get(id);
        if (!seg) {
            throw new Error(`Unknown source segment ID cited: "${id}"`);
        }
        resolved.push({
            segmentId: seg.id,
            startMs: seg.startMs,
            endMs: seg.endMs,
            text: seg.text,
        });
    }
    return resolved;
}
//# sourceMappingURL=source.js.map