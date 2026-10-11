import { parseWebVTT, getActiveCue } from './captions';

describe('captions utilities', () => {
  const sampleVtt = `WEBVTT - Test

seg-001
00:00:00.000 --> 00:00:05.000
Welcome to WatchMate AI.

seg-002
00:00:05.500 --> 00:00:12.000
Learn and explore with verifiable sources.
`;

  it('parses valid WebVTT string into cues', () => {
    const cues = parseWebVTT(sampleVtt);
    expect(cues.length).toBe(2);
    expect(cues[0]).toEqual({
      id: 'seg-001',
      startMs: 0,
      endMs: 5000,
      text: 'Welcome to WatchMate AI.',
    });
    expect(cues[1]).toEqual({
      id: 'seg-002',
      startMs: 5500,
      endMs: 12000,
      text: 'Learn and explore with verifiable sources.',
    });
  });

  it('returns active cue based on current position in milliseconds', () => {
    const cues = parseWebVTT(sampleVtt);

    expect(getActiveCue(cues, 2500)?.id).toBe('seg-001');
    expect(getActiveCue(cues, 5200)).toBeNull(); // gap between 5000 and 5500
    expect(getActiveCue(cues, 6000)?.id).toBe('seg-002');
    expect(getActiveCue(cues, 15000)).toBeNull(); // after all cues
  });

  it('handles empty or malformed VTT text safely', () => {
    expect(parseWebVTT('')).toEqual([]);
    expect(parseWebVTT('NOT_A_VTT_HEADER')).toEqual([]);
    expect(getActiveCue([], 1000)).toBeNull();
  });
});
