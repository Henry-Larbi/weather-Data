/**
 * Lightweight spaced-repetition scheduling based on the SM-2 algorithm.
 *
 * The learner grades each card with one of four buttons, which map to an SM-2
 * "quality" score:
 *   - again (0): forgot it           -> reset, due today/tomorrow
 *   - hard  (3): recalled with effort
 *   - good  (4): recalled fine
 *   - easy  (5): trivial
 *
 * We keep it deliberately small and well-commented so it's easy to tweak.
 */
import type { CardSchedule } from '../types/progress'

export type Grade = 'again' | 'hard' | 'good' | 'easy'

const QUALITY: Record<Grade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
}

const MIN_EASE = 1.3

/** Today's date as an ISO `yyyy-mm-dd` string (local time). */
export function today(): string {
  return toISODate(new Date())
}

function toISODate(d: Date): string {
  // Use local date parts so "due today" lines up with the user's calendar day.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** A brand-new card: due immediately with default SM-2 parameters. */
export function newCard(): CardSchedule {
  return { ease: 2.5, intervalDays: 0, repetitions: 0, due: today() }
}

/** Is this card due for review on the given day (defaults to today)? */
export function isDue(card: CardSchedule, on: string = today()): boolean {
  return card.due <= on
}

/**
 * Apply a grade to a card and return its next schedule.
 * Implements the core SM-2 update for interval, ease, and repetitions.
 */
export function review(card: CardSchedule, grade: Grade): CardSchedule {
  const q = QUALITY[grade]
  const now = new Date().toISOString()

  // A failing grade (< 3) resets the repetition streak; the card comes back soon.
  if (q < 3) {
    return {
      ...card,
      repetitions: 0,
      intervalDays: 1,
      due: addDays(today(), 1),
      lastReviewed: now,
      // Ease still drops a little on a lapse.
      ease: Math.max(MIN_EASE, card.ease - 0.2),
    }
  }

  const repetitions = card.repetitions + 1

  // SM-2 interval progression: 1 day, then 6 days, then interval * ease.
  let intervalDays: number
  if (repetitions === 1) intervalDays = 1
  else if (repetitions === 2) intervalDays = 6
  else intervalDays = Math.round(card.intervalDays * card.ease)

  // SM-2 ease update; clamped so cards never schedule absurdly far out too fast.
  const ease = Math.max(
    MIN_EASE,
    card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )

  return {
    ease,
    repetitions,
    intervalDays,
    due: addDays(today(), intervalDays),
    lastReviewed: now,
  }
}
