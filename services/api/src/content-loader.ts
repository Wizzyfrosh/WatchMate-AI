import fs from "node:fs";
import path from "node:path";
import {
  CatalogSchema,
  TranscriptSchema,
  type VideoRecord,
  type Transcript,
} from "@watchmate/contracts";

export interface LoadedContent {
  catalog: VideoRecord[];
  videoMap: Map<string, VideoRecord>;
  transcriptMap: Map<string, Transcript>;
}

export function loadContent(contentDirPath: string): LoadedContent {
  const catalogFile = path.join(contentDirPath, "catalog.json");
  if (!fs.existsSync(catalogFile)) {
    throw new Error(`Catalog file not found at ${catalogFile}`);
  }

  const rawCatalog = JSON.parse(fs.readFileSync(catalogFile, "utf-8"));
  const catalog = CatalogSchema.parse(rawCatalog);
  const videoMap = new Map<string, VideoRecord>();
  const transcriptMap = new Map<string, Transcript>();

  for (const video of catalog) {
    videoMap.set(video.id, video);

    const transcriptFile = path.join(contentDirPath, "transcripts", `${video.id}.json`);
    if (fs.existsSync(transcriptFile)) {
      const rawTranscript = JSON.parse(fs.readFileSync(transcriptFile, "utf-8"));
      const transcript = TranscriptSchema.parse(rawTranscript);
      transcriptMap.set(video.id, transcript);
    }
  }

  return { catalog, videoMap, transcriptMap };
}
