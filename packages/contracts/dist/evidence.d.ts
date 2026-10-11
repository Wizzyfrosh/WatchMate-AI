import { z } from "zod";
import type { Segment } from "./transcript.js";
export declare const WatchedRangeSchema: z.ZodEffects<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, [number, number], [number, number]>;
export type WatchedRange = z.infer<typeof WatchedRangeSchema>;
export declare const WatchedRangesListSchema: z.ZodArray<z.ZodEffects<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, [number, number], [number, number]>, "many">;
/**
 * Normalizes incoming watched ranges:
 * 1. Clamps each range against [0, playheadMs].
 * 2. Filters out invalid or zero-duration clamped intervals.
 * 3. Sorts ranges by startMs ascending.
 * 4. Merges overlapping or adjacent intervals.
 */
export declare function normalizeWatchedRanges(ranges: WatchedRange[], playheadMs: number): WatchedRange[];
/**
 * Selects segments that are strictly and completely covered by the normalized watched ranges.
 * A segment is excluded if it straddles a boundary or extends beyond any watched range,
 * preventing any unwatched text exposure (PRD Section 11).
 */
export declare function selectEligibleSegments(segments: Segment[], normalizedRanges: WatchedRange[]): Segment[];
/**
 * Selects eligible segments for the Explain action (last 60s of eligible watched content,
 * extending up to 120s if eligible).
 */
export declare function selectExplainSegments(segments: Segment[], normalizedRanges: WatchedRange[], playheadMs: number, windowMs?: number): Segment[];
//# sourceMappingURL=evidence.d.ts.map