import type { WatchedRange } from './types';

export function clampSeek(
  position: number,
  delta: number,
  duration: number,
): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  const current = Number.isFinite(position) ? position : 0;
  const change = Number.isFinite(delta) ? delta : 0;
  return Math.min(duration, Math.max(0, current + change));
}

export function formatTime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function formatMs(ms: number): string {
  return formatTime(ms / 1000);
}

/**
 * Merges and sorts overlapping or contiguous intervals.
 */
export function mergeRanges(ranges: WatchedRange[]): WatchedRange[] {
  if (ranges.length === 0) return [];

  const valid = ranges
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && start < end)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  if (valid.length === 0) return [];

  const merged: WatchedRange[] = [[valid[0][0], valid[0][1]]];

  for (let i = 1; i < valid.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = valid[i];

    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push([curr[0], curr[1]]);
    }
  }

  return merged;
}

/**
 * Accumulates watched ranges during continuous playback progression.
 * Discontinuous forward seek jumps (e.g. > maxStepMs) are strictly excluded.
 */
export function recordPlaybackProgression(
  existingRanges: WatchedRange[],
  prevTimeMs: number,
  currentTimeMs: number,
  maxStepMs = 1500,
): WatchedRange[] {
  if (!Number.isFinite(prevTimeMs) || !Number.isFinite(currentTimeMs)) {
    return existingRanges;
  }

  const delta = currentTimeMs - prevTimeMs;

  // Normal forward playback step
  if (delta > 0 && delta <= maxStepMs) {
    const newRange: WatchedRange = [Math.floor(prevTimeMs), Math.ceil(currentTimeMs)];
    return mergeRanges([...existingRanges, newRange]);
  }

  // If delta is negative (rewind) or > maxStepMs (forward seek jump),
  // do not record the skipped interval as watched.
  return existingRanges;
}
