import { z } from "zod";

export const SegmentSchema = z
  .object({
    id: z.string().min(1, "Segment ID is required"),
    startMs: z.number().int().min(0, "startMs must be non-negative integer"),
    endMs: z.number().int().positive("endMs must be positive integer"),
    text: z.string().min(1, "text must be non-empty"),
  })
  .refine((seg) => seg.startMs < seg.endMs, {
    message: "Segment startMs must be strictly less than endMs",
  });

export type Segment = z.infer<typeof SegmentSchema>;

export const TranscriptSchema = z
  .object({
    videoId: z.string().min(1),
    transcriptVersion: z.string().min(1),
    durationMs: z.number().int().positive(),
    segments: z.array(SegmentSchema),
  })
  .superRefine((transcript, ctx) => {
    const seenIds = new Set<string>();
    let lastStartMs = -1;

    for (let i = 0; i < transcript.segments.length; i++) {
      const seg = transcript.segments[i];

      // 1. Unique segment IDs
      if (seenIds.has(seg.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate segment ID: ${seg.id} at index ${i}`,
          path: ["segments", i, "id"],
        });
      }
      seenIds.add(seg.id);

      // 2. Monotonic startMs order
      if (seg.startMs < lastStartMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Non-monotonic segment timestamp: startMs (${seg.startMs}) is less than previous segment startMs (${lastStartMs}) at index ${i}`,
          path: ["segments", i, "startMs"],
        });
      }
      lastStartMs = seg.startMs;

      // 3. Segments must not exceed durationMs
      if (seg.endMs > transcript.durationMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Segment ${seg.id} endMs (${seg.endMs}) exceeds video durationMs (${transcript.durationMs})`,
          path: ["segments", i, "endMs"],
        });
      }
    }
  });

export type Transcript = z.infer<typeof TranscriptSchema>;
