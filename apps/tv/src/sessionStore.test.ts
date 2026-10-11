import {
  clearAllProgress,
  clearProgress,
  getCaptionsEnabled,
  getDetailPreference,
  getProgress,
  getRecentVideoIds,
  saveProgress,
  setCaptionsEnabled,
  setDetailPreference,
} from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    clearAllProgress();
    setCaptionsEnabled(true);
    setDetailPreference('standard');
  });

  it('saves and retrieves video progress', () => {
    expect(getProgress('vid-1')).toBeNull();

    saveProgress('vid-1', 45000, [[0, 45000]], false);
    const progress = getProgress('vid-1');
    expect(progress).not.toBeNull();
    expect(progress?.videoId).toBe('vid-1');
    expect(progress?.positionMs).toBe(45000);
    expect(progress?.watchedRanges).toEqual([[0, 45000]]);
    expect(progress?.completed).toBe(false);
  });

  it('clears progress for a specific video', () => {
    saveProgress('vid-1', 30000, [[0, 30000]], false);
    saveProgress('vid-2', 60000, [[0, 60000]], true);

    clearProgress('vid-1');
    expect(getProgress('vid-1')).toBeNull();
    expect(getProgress('vid-2')).not.toBeNull();
  });

  it('clears all progress', () => {
    saveProgress('vid-1', 10000, [[0, 10000]], false);
    saveProgress('vid-2', 20000, [[0, 20000]], false);

    clearAllProgress();
    expect(getProgress('vid-1')).toBeNull();
    expect(getProgress('vid-2')).toBeNull();
  });

  it('manages captions and detail preferences', () => {
    expect(getCaptionsEnabled()).toBe(true);
    setCaptionsEnabled(false);
    expect(getCaptionsEnabled()).toBe(false);

    expect(getDetailPreference()).toBe('standard');
    setDetailPreference('simple');
    expect(getDetailPreference()).toBe('simple');
  });

  it('returns recent video IDs sorted by updated time', () => {
    saveProgress('vid-1', 10000, [[0, 10000]], false);
    saveProgress('vid-2', 20000, [[0, 20000]], false);

    const recents = getRecentVideoIds();
    expect(recents).toContain('vid-1');
    expect(recents).toContain('vid-2');
  });
});
