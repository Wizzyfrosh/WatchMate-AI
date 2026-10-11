import {
  clampSeek,
  formatTime,
  formatMs,
  mergeRanges,
  recordPlaybackProgression,
} from './playback';

describe('playback utilities', () => {
  it('seek remains within the clip even with invalid player values', () => {
    expect(clampSeek(10, 5, 20)).toBe(15);
    expect(clampSeek(18, 5, 20)).toBe(20);
    expect(clampSeek(3, -5, 20)).toBe(0);
    expect(clampSeek(Number.NaN, 5, 20)).toBe(5);
    expect(clampSeek(5, 5, -1)).toBe(0);
  });

  it('time labels handle unknown duration and minute boundaries', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatMs(65000)).toBe('1:05');
  });

  it('merges overlapping and adjacent intervals', () => {
    const raw: [number, number][] = [
      [1000, 3000],
      [2500, 5000],
      [7000, 9000],
      [8500, 11000],
    ];
    const merged = mergeRanges(raw);
    expect(merged).toEqual([
      [1000, 5000],
      [7000, 11000],
    ]);
  });

  it('records continuous forward playback progression', () => {
    let ranges: [number, number][] = [];
    ranges = recordPlaybackProgression(ranges, 0, 250);
    ranges = recordPlaybackProgression(ranges, 250, 500);
    ranges = recordPlaybackProgression(ranges, 500, 750);
    ranges = recordPlaybackProgression(ranges, 750, 1000);

    expect(ranges).toEqual([[0, 1000]]);
  });

  it('does NOT record skipped intervals during forward seek jumps', () => {
    let ranges: [number, number][] = [[0, 5000]]; // watched 0-5s

    // Jump from 5s to 30s (delta = 25000ms > maxStepMs)
    ranges = recordPlaybackProgression(ranges, 5000, 30000);

    // Range should NOT include 5000..30000
    expect(ranges).toEqual([[0, 5000]]);

    // Continue playback from 30s
    ranges = recordPlaybackProgression(ranges, 30000, 30250);
    ranges = recordPlaybackProgression(ranges, 30250, 30500);

    expect(ranges).toEqual([
      [0, 5000],
      [30000, 30500],
    ]);
  });

  it('handles rewind without recording reversed intervals', () => {
    let ranges: [number, number][] = [[0, 10000]];

    // Rewind from 10s to 2s
    ranges = recordPlaybackProgression(ranges, 10000, 2000);
    expect(ranges).toEqual([[0, 10000]]);

    // Continue from 2s
    ranges = recordPlaybackProgression(ranges, 2000, 2250);
    // [2000, 2250] is already covered by [0, 10000]
    expect(ranges).toEqual([[0, 10000]]);
  });
});
