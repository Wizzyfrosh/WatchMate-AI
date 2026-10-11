import { z } from "zod";
export const WatchedRangeSchema = z
    .tuple([
    z.number().int().min(0, "Range startMs must be non-negative"),
    z.number().int().min(0, "Range endMs must be non-negative"),
])
    .refine(([startMs, endMs]) => startMs < endMs, {
    message: "Range startMs must be strictly less than endMs",
});
export const WatchedRangesListSchema = z
    .array(WatchedRangeSchema)
    .max(100, "Maximum of 100 watched ranges allowed per request");
/**
 * Normalizes incoming watched ranges:
 * 1. Clamps each range against [0, playheadMs].
 * 2. Filters out invalid or zero-duration clamped intervals.
 * 3. Sorts ranges by startMs ascending.
 * 4. Merges overlapping or adjacent intervals.
 */
export function normalizeWatchedRanges(ranges, playheadMs) {
    if (playheadMs <= 0 || ranges.length === 0) {
        return [];
    }
    const validClamped = [];
    for (const [rawStart, rawEnd] of ranges) {
        const clampedStart = Math.max(0, rawStart);
        const clampedEnd = Math.min(playheadMs, rawEnd);
        if (clampedStart < clampedEnd) {
            validClamped.push([clampedStart, clampedEnd]);
        }
    }
    if (validClamped.length === 0) {
        return [];
    }
    // Sort by startMs, then endMs
    validClamped.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    // Merge overlapping or contiguous ranges
    const merged = [validClamped[0]];
    for (let i = 1; i < validClamped.length; i++) {
        const prev = merged[merged.length - 1];
        const current = validClamped[i];
        if (current[0] <= prev[1]) {
            // Overlapping or adjacent
            prev[1] = Math.max(prev[1], current[1]);
        }
        else {
            merged.push(current);
        }
    }
    return merged;
}
/**
 * Selects segments that are strictly and completely covered by the normalized watched ranges.
 * A segment is excluded if it straddles a boundary or extends beyond any watched range,
 * preventing any unwatched text exposure (PRD Section 11).
 */
export function selectEligibleSegments(segments, normalizedRanges) {
    if (normalizedRanges.length === 0 || segments.length === 0) {
        return [];
    }
    return segments.filter((seg) => {
        // Must be completely inside at least one watched range
        return normalizedRanges.some(([rStart, rEnd]) => seg.startMs >= rStart && seg.endMs <= rEnd);
    });
}
/**
 * Selects eligible segments for the Explain action (last 60s of eligible watched content,
 * extending up to 120s if eligible).
 */
export function selectExplainSegments(segments, normalizedRanges, playheadMs, windowMs = 60000) {
    const eligible = selectEligibleSegments(segments, normalizedRanges);
    const minPlayhead = Math.max(0, playheadMs - windowMs);
    // Return eligible segments overlapping the target window
    return eligible.filter((seg) => seg.endMs > minPlayhead && seg.startMs <= playheadMs);
}
//# sourceMappingURL=evidence.js.map