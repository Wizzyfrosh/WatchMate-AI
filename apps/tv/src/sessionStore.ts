import type { VideoProgress, WatchedRange } from './types';

// In-memory store for local development. In later phases, this will
// back onto AsyncStorage for persistence across app restarts (FR09).
// The store is deliberately simple: one entry per videoId.

const progressMap = new Map<string, VideoProgress>();
let captionsEnabled = true;
let detailPreference: 'standard' | 'simple' = 'standard';

export function getProgress(videoId: string): VideoProgress | null {
  return progressMap.get(videoId) ?? null;
}

export function saveProgress(
  videoId: string,
  positionMs: number,
  watchedRanges: WatchedRange[],
  completed: boolean,
): void {
  progressMap.set(videoId, {
    videoId,
    positionMs,
    watchedRanges,
    completed,
    updatedAt: Date.now(),
  });
}

export function clearProgress(videoId: string): void {
  progressMap.delete(videoId);
}

export function clearAllProgress(): void {
  progressMap.clear();
}

export function getCaptionsEnabled(): boolean {
  return captionsEnabled;
}

export function setCaptionsEnabled(enabled: boolean): void {
  captionsEnabled = enabled;
}

export function getDetailPreference(): 'standard' | 'simple' {
  return detailPreference;
}

export function setDetailPreference(pref: 'standard' | 'simple'): void {
  detailPreference = pref;
}

/**
 * Returns all video IDs that have saved progress, sorted by most recent.
 */
export function getRecentVideoIds(): string[] {
  return Array.from(progressMap.values())
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(p => p.videoId);
}
