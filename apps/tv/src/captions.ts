import type { CaptionCue } from './types';

function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':');
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
    return 0;
  }

  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

/**
 * Parses a WebVTT formatted string into an array of CaptionCues.
 */
export function parseWebVTT(vttText: string): CaptionCue[] {
  if (!vttText || !vttText.includes('WEBVTT')) {
    return [];
  }

  const cues: CaptionCue[] = [];
  const cueRegex = /([a-z0-9-]+)\r?\n([0-9:.]+)\s+-->\s+([0-9:.]+)\r?\n([\s\S]*?)(?=\r?\n\r?\n|$)/g;

  let match: RegExpExecArray | null;
  while ((match = cueRegex.exec(vttText)) !== null) {
    const id = match[1];
    const startMs = parseTimestamp(match[2]);
    const endMs = parseTimestamp(match[3]);
    const text = match[4].replace(/\r?\n/g, ' ').trim();

    if (startMs < endMs && text.length > 0) {
      cues.push({ id, startMs, endMs, text });
    }
  }

  return cues;
}

/**
 * Returns the active caption cue for a given playback position in milliseconds.
 */
export function getActiveCue(cues: CaptionCue[], currentMs: number): CaptionCue | null {
  if (!cues || cues.length === 0 || !Number.isFinite(currentMs)) {
    return null;
  }

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (currentMs >= cue.startMs && currentMs < cue.endMs) {
      return cue;
    }
  }

  return null;
}
