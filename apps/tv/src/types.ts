export type WatchedRange = [number, number];

export interface VideoItem {
  id: string;
  title: string;
  durationMs: number;
  description: string;
  mediaKey: string;
  captionsKey: string;
  transcriptVersion: string;
  rightsId: string;
  // Local asset reference for testing or playback
  localSource?: any;
  vttContent?: string;
}

export interface CaptionCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface VideoProgress {
  videoId: string;
  positionMs: number;
  watchedRanges: WatchedRange[];
  completed: boolean;
  updatedAt: number;
}

export type ScreenState = "catalog" | "player";

export type ActionPanelState = "closed" | "menu" | "explain" | "catch_up" | "quiz";
