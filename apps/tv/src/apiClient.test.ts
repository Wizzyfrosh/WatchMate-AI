import { requestCatchUp, requestExplanation, requestQuiz } from './apiClient';

describe('apiClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('requestExplanation', () => {
    it('handles successful assist response with text and sources', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          text: 'The sun is the central star.',
          sources: [{ segmentId: 'seg-001', startMs: 0, endMs: 10000 }],
        }),
      }) as any;

      const result = await requestExplanation({
        videoId: 'lesson-01',
        transcriptVersion: 'v1',
        playheadMs: 10000,
        watchedRanges: [[0, 10000]],
        detail: 'standard',
      });

      expect(result.status).toBe('ok');
      expect(result.text).toBe('The sun is the central star.');
      expect(result.sources?.length).toBe(1);
      expect(result.sources?.[0].segmentId).toBe('seg-001');
    });

    it('handles insufficient_evidence response status', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'insufficient_evidence',
          message: 'Watch more of the lesson before requesting an explanation.',
          sources: [],
        }),
      }) as any;

      const result = await requestExplanation({
        videoId: 'lesson-01',
        transcriptVersion: 'v1',
        playheadMs: 0,
        watchedRanges: [],
        detail: 'standard',
      });

      expect(result.status).toBe('insufficient_evidence');
      expect(result.message).toContain('Watch more');
      expect(result.sources).toEqual([]);
    });

    it('handles 504 timeout error response', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: async () => ({
          code: 'GENERATION_TIMEOUT',
          message: 'Explanation request timed out.',
        }),
      }) as any;

      const result = await requestExplanation({
        videoId: 'lesson-01',
        transcriptVersion: 'v1',
        playheadMs: 10000,
        watchedRanges: [[0, 10000]],
        detail: 'standard',
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('timed out');
    });

    it('handles network failure gracefully', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network request failed')) as any;

      const result = await requestExplanation({
        videoId: 'lesson-01',
        transcriptVersion: 'v1',
        playheadMs: 10000,
        watchedRanges: [[0, 10000]],
        detail: 'standard',
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('Cannot reach the WatchMate server');
    });
  });

  describe('requestCatchUp', () => {
    it('handles successful catch-up response', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          text: 'So far we have explored the inner planets.',
          sources: [{ segmentId: 'seg-001', startMs: 0, endMs: 10000 }],
        }),
      }) as any;

      const result = await requestCatchUp({
        videoId: 'lesson-01',
        transcriptVersion: 'v1',
        playheadMs: 20000,
        watchedRanges: [[0, 20000]],
      });

      expect(result.status).toBe('ok');
      expect(result.text).toContain('explored the inner planets');
    });
  });

  describe('requestQuiz', () => {
    it('handles successful 3-question quiz response', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          questions: [
            {
              id: 'q-1',
              prompt: 'Question 1',
              options: [
                { id: 'opt-1', text: 'Option 1' },
                { id: 'opt-2', text: 'Option 2' },
                { id: 'opt-3', text: 'Option 3' },
              ],
              correctOptionId: 'opt-1',
              explanation: 'Expl 1',
              sourceIds: ['seg-001'],
            },
            {
              id: 'q-2',
              prompt: 'Question 2',
              options: [
                { id: 'opt-1', text: 'Option 1' },
                { id: 'opt-2', text: 'Option 2' },
                { id: 'opt-3', text: 'Option 3' },
              ],
              correctOptionId: 'opt-2',
              explanation: 'Expl 2',
              sourceIds: ['seg-002'],
            },
            {
              id: 'q-3',
              prompt: 'Question 3',
              options: [
                { id: 'opt-1', text: 'Option 1' },
                { id: 'opt-2', text: 'Option 2' },
                { id: 'opt-3', text: 'Option 3' },
              ],
              correctOptionId: 'opt-3',
              explanation: 'Expl 3',
              sourceIds: ['seg-003'],
            },
          ],
        }),
      }) as any;

      const result = await requestQuiz({
        videoId: 'lesson-01',
        transcriptVersion: 'v1',
        playheadMs: 30000,
        watchedRanges: [[0, 30000]],
      });

      expect(result.status).toBe('ok');
      expect(result.questions?.length).toBe(3);
    });
  });
});
