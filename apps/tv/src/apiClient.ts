import type { WatchedRange } from './types';

export interface SourceReference {
  segmentId: string;
  startMs: number;
  endMs: number;
}

export interface AssistApiResult {
  status: 'ok' | 'insufficient_evidence' | 'error';
  text?: string;
  sources?: SourceReference[];
  message?: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  sourceIds: string[];
}

export interface QuizApiResult {
  status: 'ok' | 'insufficient_evidence' | 'error';
  questions?: QuizQuestion[];
  message?: string;
}

const API_BASE_URL = 'http://10.0.2.2:3000'; // Standard Android TV Emulator host loopback

/**
 * Requests an AI explanation from the backend with timeout and error handling.
 */
export async function requestExplanation(params: {
  videoId: string;
  transcriptVersion: string;
  playheadMs: number;
  watchedRanges: WatchedRange[];
  detail: 'standard' | 'simple';
  signal?: AbortSignal;
}): Promise<AssistApiResult> {
  const requestId = `tv-req-explain-${Date.now()}`;

  try {
    const response = await fetch(`${API_BASE_URL}/v1/assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: params.videoId,
        transcriptVersion: params.transcriptVersion,
        action: 'explain',
        playheadMs: params.playheadMs,
        watchedRanges: params.watchedRanges,
        detail: params.detail,
        requestId,
      }),
      signal: params.signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'insufficient_evidence') {
        return {
          status: 'insufficient_evidence',
          message:
            data.message ||
            'Watch more of the lesson before requesting an explanation.',
          sources: [],
        };
      }
      return {
        status: 'ok',
        text: data.text,
        sources: data.sources || [],
      };
    }

    if (response.status === 504) {
      return {
        status: 'error',
        message: 'Explanation request timed out. Please try again.',
      };
    }

    const errData = await response.json().catch(() => ({}));
    return {
      status: 'error',
      message:
        errData.message ||
        'The AI service is temporarily unavailable. You can continue watching.',
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        status: 'error',
        message: 'Request was cancelled.',
      };
    }

    return {
      status: 'error',
      message: 'Cannot reach the WatchMate server. Check local backend connection.',
    };
  }
}

/**
 * Requests a Catch-up summary of watched content from the backend.
 */
export async function requestCatchUp(params: {
  videoId: string;
  transcriptVersion: string;
  playheadMs: number;
  watchedRanges: WatchedRange[];
  signal?: AbortSignal;
}): Promise<AssistApiResult> {
  const requestId = `tv-req-catchup-${Date.now()}`;

  try {
    const response = await fetch(`${API_BASE_URL}/v1/assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: params.videoId,
        transcriptVersion: params.transcriptVersion,
        action: 'catch_up',
        playheadMs: params.playheadMs,
        watchedRanges: params.watchedRanges,
        detail: 'standard',
        requestId,
      }),
      signal: params.signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'insufficient_evidence') {
        return {
          status: 'insufficient_evidence',
          message:
            data.message ||
            'Watch more of the lesson before requesting a catch-up summary.',
          sources: [],
        };
      }
      return {
        status: 'ok',
        text: data.text,
        sources: data.sources || [],
      };
    }

    if (response.status === 504) {
      return {
        status: 'error',
        message: 'Catch-up summary timed out. Please try again.',
      };
    }

    const errData = await response.json().catch(() => ({}));
    return {
      status: 'error',
      message:
        errData.message ||
        'The catch-up service is temporarily unavailable.',
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        status: 'error',
        message: 'Request was cancelled.',
      };
    }

    return {
      status: 'error',
      message: 'Cannot reach the WatchMate server. Check local backend connection.',
    };
  }
}

/**
 * Requests a 3-question grounded quiz based on watched segments.
 */
export async function requestQuiz(params: {
  videoId: string;
  transcriptVersion: string;
  playheadMs: number;
  watchedRanges: WatchedRange[];
  signal?: AbortSignal;
}): Promise<QuizApiResult> {
  const requestId = `tv-req-quiz-${Date.now()}`;

  try {
    const response = await fetch(`${API_BASE_URL}/v1/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: params.videoId,
        transcriptVersion: params.transcriptVersion,
        playheadMs: params.playheadMs,
        watchedRanges: params.watchedRanges,
        requestId,
      }),
      signal: params.signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'insufficient_evidence') {
        return {
          status: 'insufficient_evidence',
          message:
            data.message ||
            'Watch more of the lesson before taking a quiz.',
          questions: [],
        };
      }
      return {
        status: 'ok',
        questions: data.questions || [],
      };
    }

    if (response.status === 504) {
      return {
        status: 'error',
        message: 'Quiz generation timed out. Please try again.',
      };
    }

    const errData = await response.json().catch(() => ({}));
    return {
      status: 'error',
      message:
        errData.message ||
        'The quiz service is temporarily unavailable.',
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        status: 'error',
        message: 'Request was cancelled.',
      };
    }

    return {
      status: 'error',
      message: 'Cannot reach the WatchMate server. Check local backend connection.',
    };
  }
}
