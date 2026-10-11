import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import {
  ActionPanel,
  type CatchUpState,
  type ExplainState,
  type QuizState,
} from '../components/ActionPanel';
import { CaptionsView } from '../components/CaptionsView';
import { TVFocusable } from '../components/TVFocusable';
import { getActiveCue, parseWebVTT } from '../captions';
import {
  clampSeek,
  formatMs,
  formatTime,
  recordPlaybackProgression,
} from '../playback';
import {
  getCaptionsEnabled,
  getDetailPreference,
  getProgress,
  saveProgress,
  setCaptionsEnabled,
  setDetailPreference,
} from '../sessionStore';
import { requestCatchUp, requestExplanation, requestQuiz } from '../apiClient';
import type { ActionPanelState, VideoItem, WatchedRange } from '../types';

interface PlayerScreenProps {
  video: VideoItem;
  onBack: () => void;
}

export function PlayerScreen({ video, onBack }: PlayerScreenProps) {
  const player = useRef<VideoRef>(null);

  // Resume position from stored progress if available
  const existingProgress = useMemo(() => getProgress(video.id), [video.id]);
  const initialPositionMs =
    existingProgress && !existingProgress.completed
      ? existingProgress.positionMs
      : 0;

  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [positionMs, setPositionMs] = useState(initialPositionMs);
  const [durationMs, setDurationMs] = useState(video.durationMs);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [captionsOn, setCaptionsOnState] = useState(getCaptionsEnabled());
  const [actionPanel, setActionPanel] = useState<ActionPanelState>('closed');
  const [watchedRanges, setWatchedRanges] = useState<WatchedRange[]>(
    existingProgress?.watchedRanges ?? [],
  );

  // Phase 3 Explain state
  const [explainState, setExplainState] = useState<ExplainState>({
    status: 'idle',
    detail: getDetailPreference(),
  });

  // Phase 4 Catch-up state
  const [catchUpState, setCatchUpState] = useState<CatchUpState>({
    status: 'idle',
  });

  // Phase 4 Quiz state
  const [quizState, setQuizState] = useState<QuizState>({
    status: 'idle',
    questions: [],
    currentIndex: 0,
    selectedOptionId: null,
    isAnswered: false,
    score: 0,
  });

  // Invalidate stale requests via generation tracking (FR11)
  const requestGeneration = useRef(0);
  const prevTimeMs = useRef<number>(initialPositionMs);
  const lastCheckpointMs = useRef<number>(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse WebVTT cues
  const cues = useMemo(
    () => parseWebVTT(video.vttContent ?? ''),
    [video.vttContent],
  );
  const activeCue = useMemo(
    () => getActiveCue(cues, positionMs),
    [cues, positionMs],
  );

  // Save progress helper
  const commitProgress = (completed = false) => {
    saveProgress(video.id, positionMs, watchedRanges, completed);
  };

  // App lifecycle pause & resume policy (PRD §06 / FR09)
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        setPaused(true);
        commitProgress(ended);
      }
    });
    return () => sub.remove();
  }, [positionMs, watchedRanges, ended]);

  // Clean unmount commit
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      commitProgress(ended);
    };
  }, [positionMs, watchedRanges, ended]);

  // Back button handling (PRD §06 / FR10)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (actionPanel === 'explain' || actionPanel === 'catch_up' || actionPanel === 'quiz') {
        abortControllerRef.current?.abort();
        setActionPanel('menu');
        return true;
      }
      if (actionPanel === 'menu') {
        setActionPanel('closed');
        return true;
      }
      commitProgress(ended);
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [actionPanel, positionMs, watchedRanges, ended, onBack]);

  const handleSeek = (deltaSeconds: number) => {
    const currentSec = positionMs / 1000;
    const durationSec = durationMs / 1000;
    const targetSec = clampSeek(currentSec, deltaSeconds, durationSec);
    const targetMs = Math.round(targetSec * 1000);

    player.current?.seek(targetSec);
    prevTimeMs.current = targetMs;
    setPositionMs(targetMs);
    setEnded(targetMs >= durationMs);
  };

  const togglePlayback = () => {
    if (ended) {
      player.current?.seek(0);
      setPositionMs(0);
      prevTimeMs.current = 0;
      setEnded(false);
      setPaused(false);
    } else {
      const nextPaused = !paused;
      setPaused(nextPaused);
      if (nextPaused) {
        commitProgress(false);
      }
    }
  };

  const handleToggleCaptions = () => {
    const nextVal = !captionsOn;
    setCaptionsOnState(nextVal);
    setCaptionsEnabled(nextVal);
  };

  const handleOpenActionPanel = () => {
    setPaused(true);
    commitProgress(false);
    requestGeneration.current += 1;
    setActionPanel('menu');
  };

  const handleCloseActionPanel = () => {
    abortControllerRef.current?.abort();
    setActionPanel('closed');
  };

  /**
   * Phase 3: Explain request handler with frozen playhead & generation invalidation
   */
  const handleRequestExplain = async (detail: 'standard' | 'simple') => {
    setDetailPreference(detail);
    abortControllerRef.current?.abort();

    const currentGen = ++requestGeneration.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setExplainState({
      status: 'loading',
      detail,
    });

    const frozenPlayhead = positionMs;

    try {
      const result = await requestExplanation({
        videoId: video.id,
        transcriptVersion: video.transcriptVersion,
        playheadMs: frozenPlayhead,
        watchedRanges,
        detail,
        signal: controller.signal,
      });

      if (currentGen !== requestGeneration.current) return;

      if (result.status === 'insufficient_evidence') {
        setExplainState({
          status: 'insufficient_evidence',
          detail,
          errorMessage: result.message,
        });
      } else if (result.status === 'ok') {
        setExplainState({
          status: 'ready',
          text: result.text,
          sources: result.sources,
          detail,
        });
      } else {
        // Fallback for offline TV demo
        const eligibleCues = cues.filter(
          c => c.endMs <= frozenPlayhead && c.startMs >= Math.max(0, frozenPlayhead - 60000)
        );

        if (eligibleCues.length === 0) {
          setExplainState({
            status: 'insufficient_evidence',
            detail,
            errorMessage: 'Watch more of the lesson before requesting an explanation.',
          });
        } else {
          const cited = eligibleCues.slice(-2);
          const fallbackText =
            detail === 'simple'
              ? `In simple terms: ${cited.map(c => c.text).join(' ')}`
              : `Key concept: ${cited.map(c => c.text).join(' ')}`;

          setExplainState({
            status: 'ready',
            text: fallbackText,
            sources: cited.map(c => ({
              segmentId: c.id,
              startMs: c.startMs,
              endMs: c.endMs,
            })),
            detail,
          });
        }
      }
    } catch (err: any) {
      if (currentGen === requestGeneration.current) {
        setExplainState({
          status: 'error',
          detail,
          errorMessage: 'The AI service is temporarily unavailable. You can continue watching.',
        });
      }
    }
  };

  /**
   * Phase 4: Catch-up request handler
   */
  const handleRequestCatchUp = async () => {
    abortControllerRef.current?.abort();
    const currentGen = ++requestGeneration.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCatchUpState({ status: 'loading' });
    const frozenPlayhead = positionMs;

    try {
      const result = await requestCatchUp({
        videoId: video.id,
        transcriptVersion: video.transcriptVersion,
        playheadMs: frozenPlayhead,
        watchedRanges,
        signal: controller.signal,
      });

      if (currentGen !== requestGeneration.current) return;

      if (result.status === 'insufficient_evidence') {
        setCatchUpState({
          status: 'insufficient_evidence',
          errorMessage: result.message,
        });
      } else if (result.status === 'ok') {
        setCatchUpState({
          status: 'ready',
          text: result.text,
          sources: result.sources,
        });
      } else {
        // Fallback for offline demo
        const eligibleCues = cues.filter(c => c.endMs <= frozenPlayhead);
        if (eligibleCues.length === 0) {
          setCatchUpState({
            status: 'insufficient_evidence',
            errorMessage: 'Watch more of the lesson before requesting a catch-up summary.',
          });
        } else {
          setCatchUpState({
            status: 'ready',
            text: `Summary of watched content: ${eligibleCues.map(c => c.text).join(' ')}`,
            sources: eligibleCues.slice(0, 3).map(c => ({
              segmentId: c.id,
              startMs: c.startMs,
              endMs: c.endMs,
            })),
          });
        }
      }
    } catch (err: any) {
      if (currentGen === requestGeneration.current) {
        setCatchUpState({
          status: 'error',
          errorMessage: 'The catch-up service is temporarily unavailable.',
        });
      }
    }
  };

  /**
   * Phase 4: Quiz request handler
   */
  const handleRequestQuiz = async () => {
    abortControllerRef.current?.abort();
    const currentGen = ++requestGeneration.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setQuizState({
      status: 'loading',
      questions: [],
      currentIndex: 0,
      selectedOptionId: null,
      isAnswered: false,
      score: 0,
    });

    const frozenPlayhead = positionMs;

    try {
      const result = await requestQuiz({
        videoId: video.id,
        transcriptVersion: video.transcriptVersion,
        playheadMs: frozenPlayhead,
        watchedRanges,
        signal: controller.signal,
      });

      if (currentGen !== requestGeneration.current) return;

      if (result.status === 'insufficient_evidence') {
        setQuizState({
          status: 'insufficient_evidence',
          questions: [],
          currentIndex: 0,
          selectedOptionId: null,
          isAnswered: false,
          score: 0,
          errorMessage: result.message,
        });
      } else if (result.status === 'ok' && result.questions && result.questions.length === 3) {
        setQuizState({
          status: 'active',
          questions: result.questions,
          currentIndex: 0,
          selectedOptionId: null,
          isAnswered: false,
          score: 0,
        });
      } else {
        // Offline fallback
        const eligibleCues = cues.filter(c => c.endMs <= frozenPlayhead);
        if (eligibleCues.length < 3) {
          setQuizState({
            status: 'insufficient_evidence',
            questions: [],
            currentIndex: 0,
            selectedOptionId: null,
            isAnswered: false,
            score: 0,
            errorMessage: 'Watch at least three sections of the lesson before taking a quiz.',
          });
        } else {
          const fallbackQuestions = [
            {
              id: 'q-1',
              prompt: `Based on the lesson: "${eligibleCues[0].text.slice(0, 40)}...", which statement is true?`,
              options: [
                { id: 'opt-1a', text: eligibleCues[0].text },
                { id: 'opt-1b', text: 'This was not covered.' },
                { id: 'opt-1c', text: 'The opposite is correct.' },
              ],
              correctOptionId: 'opt-1a',
              explanation: `Explained in segment ${eligibleCues[0].id}.`,
              sourceIds: [eligibleCues[0].id],
            },
            {
              id: 'q-2',
              prompt: `Regarding "${eligibleCues[1].text.slice(0, 40)}...":`,
              options: [
                { id: 'opt-2a', text: 'Incorrect distractor' },
                { id: 'opt-2b', text: eligibleCues[1].text },
                { id: 'opt-2c', text: 'Unrelated fact' },
              ],
              correctOptionId: 'opt-2b',
              explanation: `Explained in segment ${eligibleCues[1].id}.`,
              sourceIds: [eligibleCues[1].id],
            },
            {
              id: 'q-3',
              prompt: `What was concluded in: "${eligibleCues[2].text.slice(0, 40)}..."?`,
              options: [
                { id: 'opt-3a', text: eligibleCues[2].text },
                { id: 'opt-3b', text: 'None of the above' },
                { id: 'opt-3c', text: 'Alternative theory' },
              ],
              correctOptionId: 'opt-3a',
              explanation: `Explained in segment ${eligibleCues[2].id}.`,
              sourceIds: [eligibleCues[2].id],
            },
          ];

          setQuizState({
            status: 'active',
            questions: fallbackQuestions,
            currentIndex: 0,
            selectedOptionId: null,
            isAnswered: false,
            score: 0,
          });
        }
      }
    } catch (err: any) {
      if (currentGen === requestGeneration.current) {
        setQuizState({
          status: 'error',
          questions: [],
          currentIndex: 0,
          selectedOptionId: null,
          isAnswered: false,
          score: 0,
          errorMessage: 'The quiz service is temporarily unavailable.',
        });
      }
    }
  };

  const handleAnswerQuizQuestion = (optionId: string) => {
    if (quizState.isAnswered || quizState.status !== 'active') return;
    const currentQ = quizState.questions[quizState.currentIndex];
    const isCorrect = currentQ && optionId === currentQ.correctOptionId;

    setQuizState(prev => ({
      ...prev,
      selectedOptionId: optionId,
      isAnswered: true,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const handleNextQuizQuestion = () => {
    if (quizState.currentIndex + 1 < quizState.questions.length) {
      setQuizState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedOptionId: null,
        isAnswered: false,
      }));
    } else {
      setQuizState(prev => ({
        ...prev,
        status: 'finished',
      }));
    }
  };

  /**
   * Source Replay action (FR06 & FR08)
   */
  const handleReplaySource = (startMs: number) => {
    // If startMs is 0 and we are in an answered quiz question, resolve from current question source
    let targetMs = startMs;
    if (targetMs === 0 && quizState.status === 'active' && quizState.questions[quizState.currentIndex]) {
      const q = quizState.questions[quizState.currentIndex];
      const matchingCue = cues.find(c => q.sourceIds.includes(c.id));
      if (matchingCue) {
        targetMs = matchingCue.startMs;
      }
    }

    const targetSec = targetMs / 1000;
    player.current?.seek(targetSec);
    prevTimeMs.current = targetMs;
    setPositionMs(targetMs);
    setEnded(false);
    setActionPanel('closed');
    setPaused(false);
  };

  const evidenceLabel = `Based on watched sections up to ${formatMs(positionMs)}`;

  const statusText = failed
    ? 'Playback failed. Select Exit to return.'
    : !ready
    ? 'Loading clip…'
    : buffering
    ? 'Buffering…'
    : ended
    ? 'Clip finished. Select Replay.'
    : paused
    ? 'Paused'
    : 'Playing';

  return (
    <View style={styles.screen}>
      {/* Main Video Viewport */}
      <View style={[styles.videoContainer, actionPanel !== 'closed' && styles.videoDimmed]}>
        {!failed && (
          <Video
            ref={player}
            source={video.localSource}
            style={styles.video}
            resizeMode="contain"
            paused={paused}
            controls={false}
            repeat={false}
            playInBackground={false}
            playWhenInactive={false}
            progressUpdateInterval={250}
            onLoad={event => {
              if (event.duration > 0) {
                setDurationMs(Math.round(event.duration * 1000));
              }
              setReady(true);
              if (initialPositionMs > 0) {
                player.current?.seek(initialPositionMs / 1000);
              }
            }}
            onProgress={event => {
              const currentMs = Math.round(event.currentTime * 1000);
              const updatedRanges = recordPlaybackProgression(
                watchedRanges,
                prevTimeMs.current,
                currentMs,
              );
              prevTimeMs.current = currentMs;
              setWatchedRanges(updatedRanges);
              setPositionMs(currentMs);

              // Periodic 5-second checkpoint
              const now = Date.now();
              if (now - lastCheckpointMs.current >= 5000) {
                lastCheckpointMs.current = now;
                saveProgress(video.id, currentMs, updatedRanges, false);
              }
            }}
            onSeek={event => {
              const seekMs = Math.round(event.seekTime * 1000);
              setPositionMs(seekMs);
              prevTimeMs.current = seekMs;
              setEnded(seekMs >= durationMs);
            }}
            onBuffer={event => setBuffering(event.isBuffering)}
            onEnd={() => {
              setPaused(true);
              setEnded(true);
              setPositionMs(durationMs);
              commitProgress(true);
            }}
            onError={() => {
              setPaused(true);
              setReady(false);
              setFailed(true);
            }}
            onAudioBecomingNoisy={() => setPaused(true)}
            onAudioFocusChanged={event => {
              if (!event.hasAudioFocus) {
                setPaused(true);
              }
            }}
          />
        )}

        {/* Captions Overlay */}
        <CaptionsView cue={activeCue} visible={captionsOn} />

        {/* Error message */}
        {failed && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>Unable to load the requested video.</Text>
          </View>
        )}
      </View>

      {/* Playhead & Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusInfo}>
          <Text style={styles.videoTitle} numberOfLines={1}>
            {video.title}
          </Text>
          <Text style={styles.statusLabel}>{statusText}</Text>
        </View>
        <Text style={styles.timeLabel}>
          {formatMs(positionMs)} / {formatMs(durationMs)}
        </Text>
      </View>

      {/* TV D-Pad Controls Row */}
      {actionPanel === 'closed' && (
        <TVFocusGuideView autoFocus style={styles.controlsRow}>
          <TVFocusable
            label={ended ? 'Replay' : paused ? 'Play' : 'Pause'}
            onPress={togglePlayback}
            preferred={ready && !failed}
            disabled={!ready || failed}
            style={styles.controlButton}
          />
          <TVFocusable
            label="-5s"
            onPress={() => handleSeek(-5)}
            disabled={!ready || failed}
            style={styles.controlButton}
          />
          <TVFocusable
            label="+5s"
            onPress={() => handleSeek(5)}
            disabled={!ready || failed}
            style={styles.controlButton}
          />
          <TVFocusable
            label={`CC: ${captionsOn ? 'ON' : 'OFF'}`}
            onPress={handleToggleCaptions}
            style={styles.controlButton}
          />
          <TVFocusable
            label="WatchMate"
            onPress={handleOpenActionPanel}
            disabled={!ready || failed}
            style={styles.watchmateButton}
          />
          <TVFocusable
            label="Back to Catalog"
            onPress={() => {
              commitProgress(ended);
              onBack();
            }}
            style={styles.exitButton}
          />
        </TVFocusGuideView>
      )}

      {/* WatchMate 38% Action Panel Overlay */}
      <ActionPanel
        panelState={actionPanel}
        onSelectAction={action => setActionPanel(action)}
        onClose={handleCloseActionPanel}
        evidenceLabel={evidenceLabel}
        explainState={explainState}
        onRequestExplain={handleRequestExplain}
        catchUpState={catchUpState}
        onRequestCatchUp={handleRequestCatchUp}
        quizState={quizState}
        onRequestQuiz={handleRequestQuiz}
        onAnswerQuizQuestion={handleAnswerQuizQuestion}
        onNextQuizQuestion={handleNextQuizQuestion}
        onReplaySource={handleReplaySource}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDimmed: {
    opacity: 0.65,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    borderRadius: 12,
  },
  errorText: {
    color: '#FFB4AB',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 12,
    backgroundColor: '#162235',
  },
  statusInfo: {
    flex: 1,
  },
  videoTitle: {
    color: '#F4F7FB',
    fontSize: 18,
    fontWeight: '700',
  },
  statusLabel: {
    color: '#B9C5D6',
    fontSize: 14,
    marginTop: 2,
  },
  timeLabel: {
    color: '#65D6CB',
    fontSize: 16,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    backgroundColor: '#0B1220',
  },
  controlButton: {
    backgroundColor: '#162235',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
  },
  watchmateButton: {
    backgroundColor: '#243950',
    borderColor: '#65D6CB',
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exitButton: {
    backgroundColor: '#162235',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
