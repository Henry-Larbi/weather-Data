/**
 * Learner progress types. This is the shape persisted per user (in Supabase
 * when signed in, otherwise in localStorage).
 */

/** SM-2 style scheduling state for a single flashcard. */
export interface CardSchedule {
  /** Easiness factor (SM-2). Starts at 2.5, never drops below 1.3. */
  ease: number
  /** Current interval in days until the next review. */
  intervalDays: number
  /** Number of consecutive successful reviews. */
  repetitions: number
  /** ISO date (yyyy-mm-dd) the card is next due. */
  due: string
  /** ISO timestamp of the last review, if any. */
  lastReviewed?: string
}

export interface QuizAttempt {
  /** ISO timestamp of the attempt. */
  at: string
  score: number
  total: number
}

export interface QuizRecord {
  best: number
  total: number
  attempts: QuizAttempt[]
}

export interface ProgressState {
  /** Schema version, so we can migrate stored data later. */
  version: number
  /** moduleId -> true once the lesson is marked complete. */
  lessonsCompleted: Record<string, boolean>
  /** quizId -> quiz history. */
  quizzes: Record<string, QuizRecord>
  /** flashcard id -> scheduling state. */
  cards: Record<string, CardSchedule>
}

export const emptyProgress: ProgressState = {
  version: 1,
  lessonsCompleted: {},
  quizzes: {},
  cards: {},
}
