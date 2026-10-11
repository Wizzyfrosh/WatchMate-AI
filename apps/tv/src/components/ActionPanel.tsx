import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { TVFocusable } from './TVFocusable';
import { formatMs } from '../playback';
import type { ActionPanelState } from '../types';
import type { QuizQuestion } from '../apiClient';

export interface SourceReference {
  segmentId: string;
  startMs: number;
  endMs: number;
}

export interface ExplainState {
  status: 'idle' | 'loading' | 'ready' | 'insufficient_evidence' | 'error';
  text?: string;
  sources?: SourceReference[];
  detail: 'standard' | 'simple';
  errorMessage?: string;
}

export interface CatchUpState {
  status: 'idle' | 'loading' | 'ready' | 'insufficient_evidence' | 'error';
  text?: string;
  sources?: SourceReference[];
  errorMessage?: string;
}

export interface QuizState {
  status: 'idle' | 'loading' | 'active' | 'insufficient_evidence' | 'error' | 'finished';
  questions: QuizQuestion[];
  currentIndex: number;
  selectedOptionId: string | null;
  isAnswered: boolean;
  score: number;
  errorMessage?: string;
}

interface ActionPanelProps {
  panelState: ActionPanelState;
  onSelectAction: (action: ActionPanelState) => void;
  onClose: () => void;
  evidenceLabel: string;
  explainState: ExplainState;
  onRequestExplain: (detail: 'standard' | 'simple') => void;
  catchUpState: CatchUpState;
  onRequestCatchUp: () => void;
  quizState: QuizState;
  onRequestQuiz: () => void;
  onAnswerQuizQuestion: (optionId: string) => void;
  onNextQuizQuestion: () => void;
  onReplaySource: (startMs: number) => void;
}

/**
 * WatchMate action panel (~38% right drawer, PRD §05 / §06).
 * Supports Explain, Catch-up, and 3-Question Quiz with wrong-answer replay remediation.
 */
export function ActionPanel({
  panelState,
  onSelectAction,
  onClose,
  evidenceLabel,
  explainState,
  onRequestExplain,
  catchUpState,
  onRequestCatchUp,
  quizState,
  onRequestQuiz,
  onAnswerQuizQuestion,
  onNextQuizQuestion,
  onReplaySource,
}: ActionPanelProps) {
  if (panelState === 'closed') {
    return null;
  }

  const currentQuestion =
    quizState.status === 'active' && quizState.questions.length > quizState.currentIndex
      ? quizState.questions[quizState.currentIndex]
      : null;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WatchMate</Text>
        <Text style={styles.evidenceLabel}>{evidenceLabel}</Text>
      </View>

      {/* Main Menu */}
      {panelState === 'menu' && (
        <TVFocusGuideView autoFocus style={styles.menuList}>
          <TVFocusable
            label="Explain this moment"
            onPress={() => {
              onSelectAction('explain');
              onRequestExplain(explainState.detail);
            }}
            preferred
            style={styles.menuItem}
          />
          <TVFocusable
            label="Catch me up"
            onPress={() => {
              onSelectAction('catch_up');
              onRequestCatchUp();
            }}
            style={styles.menuItem}
          />
          <TVFocusable
            label="Quiz me"
            onPress={() => {
              onSelectAction('quiz');
              onRequestQuiz();
            }}
            style={styles.menuItem}
          />
          <TVFocusable
            label="Close"
            onPress={onClose}
            style={styles.closeItem}
          />
        </TVFocusGuideView>
      )}

      {/* Explain View */}
      {panelState === 'explain' && (
        <ScrollView style={styles.resultArea} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultLabel}>Explain this moment</Text>

          {explainState.status === 'loading' && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Finding the relevant section…</Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Cancel"
                  onPress={() => onSelectAction('menu')}
                  preferred
                  style={styles.secondaryAction}
                />
              </TVFocusGuideView>
            </View>
          )}

          {explainState.status === 'insufficient_evidence' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.insufficientText}>
                {explainState.errorMessage ||
                  'Watch more of the lesson before requesting an explanation.'}
              </Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  preferred
                  style={styles.primaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}

          {explainState.status === 'error' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.errorText}>
                {explainState.errorMessage ||
                  'The AI service is temporarily unavailable. You can continue watching.'}
              </Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Retry"
                  onPress={() => onRequestExplain(explainState.detail)}
                  preferred
                  style={styles.primaryAction}
                />
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  style={styles.secondaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}

          {explainState.status === 'ready' && (
            <View style={styles.readyContainer}>
              <Text style={styles.explanationText}>
                {explainState.text}
              </Text>

              {/* Detail adaptation toggle button (FR04) */}
              <View style={styles.toggleSection}>
                <TVFocusable
                  label={
                    explainState.detail === 'standard'
                      ? '⚡ Make it simpler'
                      : '📖 Standard detail'
                  }
                  onPress={() =>
                    onRequestExplain(
                      explainState.detail === 'standard' ? 'simple' : 'standard'
                    )
                  }
                  style={styles.detailToggleButton}
                />
              </View>

              {/* Source Replay Citations (FR06) */}
              {explainState.sources && explainState.sources.length > 0 && (
                <View style={styles.sourcesSection}>
                  <Text style={styles.sourcesHeader}>Verified Sources</Text>
                  <TVFocusGuideView style={styles.sourcesList}>
                    {explainState.sources.map((src) => (
                      <TVFocusable
                        key={src.segmentId}
                        label={`Replay from ${formatMs(src.startMs)}`}
                        onPress={() => onReplaySource(src.startMs)}
                        preferred
                        style={styles.replayButton}
                      />
                    ))}
                  </TVFocusGuideView>
                </View>
              )}

              <TVFocusGuideView style={styles.resultActions}>
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  style={styles.secondaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}
        </ScrollView>
      )}

      {/* Catch-up View (Phase 4) */}
      {panelState === 'catch_up' && (
        <ScrollView style={styles.resultArea} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultLabel}>Catch me up</Text>

          {catchUpState.status === 'loading' && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Summarizing watched lesson…</Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Cancel"
                  onPress={() => onSelectAction('menu')}
                  preferred
                  style={styles.secondaryAction}
                />
              </TVFocusGuideView>
            </View>
          )}

          {catchUpState.status === 'insufficient_evidence' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.insufficientText}>
                {catchUpState.errorMessage ||
                  'Watch more of the lesson before requesting a catch-up summary.'}
              </Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  preferred
                  style={styles.primaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}

          {catchUpState.status === 'error' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.errorText}>
                {catchUpState.errorMessage ||
                  'The catch-up service is temporarily unavailable.'}
              </Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Retry"
                  onPress={onRequestCatchUp}
                  preferred
                  style={styles.primaryAction}
                />
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  style={styles.secondaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}

          {catchUpState.status === 'ready' && (
            <View style={styles.readyContainer}>
              <Text style={styles.explanationText}>
                {catchUpState.text}
              </Text>

              {catchUpState.sources && catchUpState.sources.length > 0 && (
                <View style={styles.sourcesSection}>
                  <Text style={styles.sourcesHeader}>Key Moments</Text>
                  <TVFocusGuideView style={styles.sourcesList}>
                    {catchUpState.sources.map((src) => (
                      <TVFocusable
                        key={src.segmentId}
                        label={`Replay from ${formatMs(src.startMs)}`}
                        onPress={() => onReplaySource(src.startMs)}
                        style={styles.replayButton}
                      />
                    ))}
                  </TVFocusGuideView>
                </View>
              )}

              <TVFocusGuideView style={styles.resultActions}>
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  style={styles.secondaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}
        </ScrollView>
      )}

      {/* Quiz View (Phase 4, FR07 & FR08) */}
      {panelState === 'quiz' && (
        <ScrollView style={styles.resultArea} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultLabel}>Knowledge Check</Text>

          {quizState.status === 'loading' && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Generating quiz from watched concepts…</Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Cancel"
                  onPress={() => onSelectAction('menu')}
                  preferred
                  style={styles.secondaryAction}
                />
              </TVFocusGuideView>
            </View>
          )}

          {quizState.status === 'insufficient_evidence' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.insufficientText}>
                {quizState.errorMessage ||
                  'Watch at least three sections of the lesson before taking a quiz.'}
              </Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  preferred
                  style={styles.primaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}

          {quizState.status === 'error' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.errorText}>
                {quizState.errorMessage ||
                  'The quiz service is temporarily unavailable.'}
              </Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Retry"
                  onPress={onRequestQuiz}
                  preferred
                  style={styles.primaryAction}
                />
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  style={styles.secondaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}

          {quizState.status === 'active' && currentQuestion && (
            <View style={styles.readyContainer}>
              <Text style={styles.quizProgress}>
                Question {quizState.currentIndex + 1} of {quizState.questions.length}
              </Text>
              <Text style={styles.quizPrompt}>{currentQuestion.prompt}</Text>

              {/* Options list */}
              <TVFocusGuideView autoFocus style={styles.optionsList}>
                {currentQuestion.options.map((opt) => {
                  const isSelected = quizState.selectedOptionId === opt.id;
                  const isCorrect = opt.id === currentQuestion.correctOptionId;
                  let optStyle = styles.optionItem;

                  if (quizState.isAnswered) {
                    if (isCorrect) {
                      optStyle = styles.correctOptionItem;
                    } else if (isSelected && !isCorrect) {
                      optStyle = styles.incorrectOptionItem;
                    }
                  }

                  return (
                    <TVFocusable
                      key={opt.id}
                      label={opt.text}
                      disabled={quizState.isAnswered}
                      onPress={() => onAnswerQuizQuestion(opt.id)}
                      style={optStyle}
                    />
                  );
                })}
              </TVFocusGuideView>

              {/* Feedback and Wrong-Answer Remediation (FR08) */}
              {quizState.isAnswered && (
                <View style={styles.feedbackBox}>
                  <Text
                    style={
                      quizState.selectedOptionId === currentQuestion.correctOptionId
                        ? styles.correctLabel
                        : styles.incorrectLabel
                    }
                  >
                    {quizState.selectedOptionId === currentQuestion.correctOptionId
                      ? '✓ Correct!'
                      : '✗ Incorrect'}
                  </Text>
                  {currentQuestion.explanation ? (
                    <Text style={styles.quizExplanation}>
                      {currentQuestion.explanation}
                    </Text>
                  ) : null}

                  {/* Remediation replay button */}
                  <TVFocusGuideView autoFocus style={styles.feedbackActions}>
                    <TVFocusable
                      label="Replay relevant section"
                      onPress={() => onReplaySource(0)} // Replay source triggers
                      style={styles.replayButton}
                    />
                    <TVFocusable
                      label={
                        quizState.currentIndex + 1 < quizState.questions.length
                          ? 'Next Question'
                          : 'View Results'
                      }
                      onPress={onNextQuizQuestion}
                      preferred
                      style={styles.primaryAction}
                    />
                  </TVFocusGuideView>
                </View>
              )}
            </View>
          )}

          {quizState.status === 'finished' && (
            <View style={styles.finishedContainer}>
              <Text style={styles.scoreTitle}>Quiz Completed!</Text>
              <Text style={styles.scoreText}>
                You answered {quizState.score} of {quizState.questions.length} questions correctly.
              </Text>
              <TVFocusGuideView autoFocus style={styles.resultActions}>
                <TVFocusable
                  label="Retake Quiz"
                  onPress={onRequestQuiz}
                  preferred
                  style={styles.primaryAction}
                />
                <TVFocusable
                  label="Back to menu"
                  onPress={() => onSelectAction('menu')}
                  style={styles.secondaryAction}
                />
                <TVFocusable label="Close" onPress={onClose} style={styles.secondaryAction} />
              </TVFocusGuideView>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '38%',
    backgroundColor: 'rgba(22, 34, 53, 0.96)',
    borderLeftWidth: 1,
    borderLeftColor: '#243950',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#65D6CB',
    fontSize: 22,
    fontWeight: '700',
  },
  evidenceLabel: {
    color: '#B9C5D6',
    fontSize: 13,
    marginTop: 4,
  },
  menuList: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: '#1d2d45',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  closeItem: {
    backgroundColor: 'transparent',
    borderColor: '#B9C5D6',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 8,
  },
  resultArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  resultLabel: {
    color: '#F4F7FB',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD166',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  feedbackContainer: {
    paddingVertical: 12,
  },
  insufficientText: {
    color: '#B9C5D6',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  errorText: {
    color: '#FFB4AB',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  readyContainer: {
    paddingVertical: 8,
  },
  explanationText: {
    color: '#F4F7FB',
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 16,
  },
  toggleSection: {
    marginBottom: 20,
  },
  detailToggleButton: {
    backgroundColor: '#243950',
    borderColor: '#65D6CB',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sourcesSection: {
    marginTop: 8,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#243950',
  },
  sourcesHeader: {
    color: '#65D6CB',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sourcesList: {
    gap: 10,
  },
  replayButton: {
    backgroundColor: '#1d2d45',
    borderColor: '#FFD166',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quizProgress: {
    color: '#65D6CB',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  quizPrompt: {
    color: '#F4F7FB',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionItem: {
    backgroundColor: '#1d2d45',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  correctOptionItem: {
    backgroundColor: '#1b4332',
    borderColor: '#2d6a4f',
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  incorrectOptionItem: {
    backgroundColor: '#4a151b',
    borderColor: '#801824',
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  feedbackBox: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#243950',
  },
  correctLabel: {
    color: '#65D6CB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  incorrectLabel: {
    color: '#FFB4AB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  quizExplanation: {
    color: '#B9C5D6',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  feedbackActions: {
    gap: 10,
  },
  finishedContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  scoreTitle: {
    color: '#65D6CB',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  scoreText: {
    color: '#F4F7FB',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  resultActions: {
    gap: 10,
    marginTop: 20,
  },
  primaryAction: {
    backgroundColor: '#243950',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderColor: '#415a77',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
