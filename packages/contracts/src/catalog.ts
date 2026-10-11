import { z } from "zod";

export const VideoRecordSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, "Video ID must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1).max(150),
  durationMs: z.number().int().positive("Duration must be a positive integer in milliseconds"),
  description: z.string().min(1).max(1000),
  mediaKey: z.string().min(1),
  captionsKey: z.string().min(1),
  transcriptVersion: z.string().min(1),
  rightsId: z.string().min(1),
  thumbnailKey: z.string().optional(),
});

export type VideoRecord = z.infer<typeof VideoRecordSchema>;

export const CatalogSchema = z
  .array(VideoRecordSchema)
  .refine(
    (videos) => {
      const ids = new Set<string>();
      for (const v of videos) {
        if (ids.has(v.id)) return false;
        ids.add(v.id);
      }
      return true;
    },
    { message: "Catalog contains duplicate video IDs" }
  );

export type Catalog = z.infer<typeof CatalogSchema>;
