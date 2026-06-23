/**
 * Core content types for PyLearn.
 *
 * These types are deliberately *subject-agnostic*: nothing here mentions
 * Python. v1 ships Python content, but a future "Math" subject is just another
 * content folder + manifest entry that conforms to these same shapes.
 *
 * All learning content (lessons, quizzes, flashcards) lives in `/src/content`
 * as data and is described by `/src/content/manifest.ts`. Components read these
 * types — they never hard-code subject text.
 */

export type Level = 'beginner' | 'intermediate' | 'advanced'

/** A runnable code snippet that can be opened in the CodePlayground. */
export interface CodeExample {
  /** Short human label, e.g. "Greeting the user". */
  title: string
  /** The starter source code (Python for v1). */
  code: string
  /** Optional one-line explanation shown above the editor. */
  description?: string
}

/**
 * A single lesson. `body` is Markdown (GFM) and may contain fenced code
 * blocks; these render with syntax highlighting in the LessonViewer.
 */
export interface Lesson {
  /** Stable, URL-safe id, unique within the subject. */
  id: string
  title: string
  /** One-sentence summary shown on cards and the dashboard. */
  summary: string
  /** Markdown content of the lesson. */
  body: string
  /** Runnable examples that open in the playground. */
  examples?: CodeExample[]
  /** Estimated reading/practice time in minutes (for the UI only). */
  estimatedMinutes?: number
}

export type QuestionKind = 'multiple-choice' | 'predict-output'

/**
 * A quiz question.
 *
 * - `multiple-choice`: pick the single correct option.
 * - `predict-output`: same UI (pick the option), but `prompt` includes a code
 *   snippet and the options are candidate program outputs.
 */
export interface Question {
  id: string
  kind: QuestionKind
  /** The question text (Markdown allowed, e.g. to embed a code block). */
  prompt: string
  /** Answer options shown to the learner. */
  options: string[]
  /** Index into `options` of the correct answer. */
  answerIndex: number
  /** Shown after answering, regardless of correctness. */
  explanation?: string
}

export interface Quiz {
  id: string
  title: string
  questions: Question[]
}

/** A spaced-repetition flashcard (front/back). */
export interface Flashcard {
  id: string
  front: string
  back: string
}

/**
 * A module groups one lesson + one quiz + a set of flashcards under a single
 * topic (e.g. "Strings"). This is the unit the curriculum tree displays.
 */
export interface Module {
  /** Stable, URL-safe id, unique within the subject. */
  id: string
  title: string
  level: Level
  /** Short blurb for the curriculum card. */
  description: string
  lesson: Lesson
  quiz: Quiz
  flashcards: Flashcard[]
}

/** A subject is a whole curriculum (Python, and later Math, etc.). */
export interface Subject {
  id: string
  title: string
  description: string
  modules: Module[]
}
