import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CatalogSchema,
  TranscriptSchema,
  RightsCatalogSchema,
} from "../packages/contracts/dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = __dirname;

function parseVttTimestampToMs(ts) {
  // Expected format: HH:MM:SS.mmm or MM:SS.mmm
  const parts = ts.trim().split(":");
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0], 10);
    seconds = parseFloat(parts[1]);
  } else {
    throw new Error(`Invalid VTT timestamp format: ${ts}`);
  }

  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

export function validateContent() {
  console.log("Validating content package...");

  // 1. Validate catalog.json
  const catalogPath = path.join(contentDir, "catalog.json");
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Missing catalog file at ${catalogPath}`);
  }
  const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
  const catalog = CatalogSchema.parse(rawCatalog);
  console.log(`✓ Catalog schema valid (${catalog.length} videos found)`);

  // 2. Validate rights.json
  const rightsPath = path.join(contentDir, "rights.json");
  if (!fs.existsSync(rightsPath)) {
    throw new Error(`Missing rights file at ${rightsPath}`);
  }
  const rawRights = JSON.parse(fs.readFileSync(rightsPath, "utf-8"));
  const rightsCatalog = RightsCatalogSchema.parse(rawRights);
  const rightsMap = new Map(rightsCatalog.map((r) => [r.rightsId, r]));
  console.log(`✓ Rights records valid (${rightsCatalog.length} records found)`);

  // 3. For each video, validate transcript and captions
  for (const video of catalog) {
    console.log(`Checking video: ${video.id}`);

    // Verify rights ID
    if (!rightsMap.has(video.rightsId)) {
      throw new Error(`Video ${video.id} references missing rightsId: ${video.rightsId}`);
    }
    const rights = rightsMap.get(video.rightsId);
    console.log(`  ✓ Rights record linked (${rights.rightsId}, status: ${rights.status})`);

    // Transcript check
    const transcriptPath = path.join(contentDir, "transcripts", `${video.id}.json`);
    if (!fs.existsSync(transcriptPath)) {
      throw new Error(`Missing transcript for video ${video.id} at ${transcriptPath}`);
    }
    const rawTranscript = JSON.parse(fs.readFileSync(transcriptPath, "utf-8"));
    const transcript = TranscriptSchema.parse(rawTranscript);
    if (transcript.videoId !== video.id) {
      throw new Error(`Transcript videoId mismatch: expected ${video.id}, got ${transcript.videoId}`);
    }
    if (transcript.transcriptVersion !== video.transcriptVersion) {
      throw new Error(`Transcript version mismatch: expected ${video.transcriptVersion}, got ${transcript.transcriptVersion}`);
    }
    console.log(`  ✓ Transcript valid (${transcript.segments.length} segments, duration ${transcript.durationMs}ms)`);

    // Captions check
    const captionsPath = path.join(contentDir, "captions", `${video.id}.vtt`);
    if (!fs.existsSync(captionsPath)) {
      throw new Error(`Missing captions for video ${video.id} at ${captionsPath}`);
    }
    const vttContent = fs.readFileSync(captionsPath, "utf-8");
    if (!vttContent.startsWith("WEBVTT")) {
      throw new Error(`Captions file ${captionsPath} must begin with WEBVTT header`);
    }

    // Verify cue timestamps against transcript segments
    const cueRegex = /([a-z0-9-]+)\r?\n([0-9:.]+)\s+-->\s+([0-9:.]+)\r?\n([\s\S]*?)(?=\r?\n\r?\n|$)/g;
    let match;
    const vttCues = [];
    while ((match = cueRegex.exec(vttContent)) !== null) {
      vttCues.push({
        id: match[1],
        startMs: parseVttTimestampToMs(match[2]),
        endMs: parseVttTimestampToMs(match[3]),
        text: match[4].trim(),
      });
    }

    if (vttCues.length !== transcript.segments.length) {
      throw new Error(
        `Cue count mismatch: VTT has ${vttCues.length} cues, transcript has ${transcript.segments.length} segments`
      );
    }

    for (let i = 0; i < transcript.segments.length; i++) {
      const seg = transcript.segments[i];
      const cue = vttCues[i];

      if (cue.id !== seg.id) {
        throw new Error(`Cue ID mismatch at index ${i}: expected ${seg.id}, got ${cue.id}`);
      }
      if (Math.abs(cue.startMs - seg.startMs) > 100) {
        throw new Error(`Cue startMs mismatch at ${seg.id}: seg=${seg.startMs}, cue=${cue.startMs}`);
      }
      if (Math.abs(cue.endMs - seg.endMs) > 100) {
        throw new Error(`Cue endMs mismatch at ${seg.id}: seg=${seg.endMs}, cue=${cue.endMs}`);
      }
    }
    console.log(`  ✓ WebVTT captions aligned with transcript (${vttCues.length} cues verified)`);
  }

  console.log("✓ Content package validation passed completely.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    validateContent();
  } catch (err) {
    console.error("Content validation failed:", err);
    process.exit(1);
  }
}
