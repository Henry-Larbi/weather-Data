/**
 * Progress context.
 *
 * Holds the learner's progress in React state, reloads it whenever the signed-in
 * user changes, and persists changes (debounced) through the progress repo —
 * which routes to Supabase or localStorage automatically.
 *
 * Components mutate progress only through the helpers exposed here, so the
 * persistence concern stays in one place.
 */
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Flashcard } from '../types/content'
import type { ProgressState } from '../types/progress'
import { emptyProgress } from '../types/progress'
import { loadProgress, saveProgress } from '../lib/progressRepo'
import { isDue, newCard, review, today, type Grade } from '../lib/srs'
import { useAuth } from './AuthContext'

export interface DueCard extends Flashcard {
  moduleId: string
}

interface ProgressContextValue {
  progress: ProgressState
  ready: boolean
  isLessonComplete: (moduleId: string) => boolean
  markLessonComplete: (moduleId: string, complete: boolean) => void
  recordQuizAttempt: (quizId: string, score: number, total: number) => void
  gradeCard: (cardId: string, grade: Grade) => void
  /** From a set of candidate cards, which are due today (new cards count). */
  dueCards: (cards: DueCard[]) => DueCard[]
  resetAll: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [progress, setProgress] = useState<ProgressState>(emptyProgress)
  const [ready, setReady] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // (Re)load progress whenever the auth user resolves or changes.
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setReady(false)
    loadProgress(user?.id ?? null).then((loaded) => {
      if (!cancelled) {
        setProgress(loaded)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.id, authLoading])

  // Debounced persistence: coalesce rapid updates into one write.
  const persist = useCallback(
    (next: ProgressState) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        void saveProgress(user?.id ?? null, next)
      }, 400)
    },
    [user?.id],
  )

  // Helper that applies an updater, sets state, and schedules a save.
  const update = useCallback(
    (fn: (prev: ProgressState) => ProgressState) => {
      setProgress((prev) => {
        const next = fn(prev)
        persist(next)
        return next
      })
    },
    [persist],
  )

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      ready,
      isLessonComplete: (moduleId) => Boolean(progress.lessonsCompleted[moduleId]),
      markLessonComplete: (moduleId, complete) =>
        update((prev) => ({
          ...prev,
          lessonsCompleted: { ...prev.lessonsCompleted, [moduleId]: complete },
        })),
      recordQuizAttempt: (quizId, score, total) =>
        update((prev) => {
          const existing = prev.quizzes[quizId]
          const attempt = { at: new Date().toISOString(), score, total }
          return {
            ...prev,
            quizzes: {
              ...prev.quizzes,
              [quizId]: {
                best: Math.max(existing?.best ?? 0, score),
                total,
                attempts: [...(existing?.attempts ?? []), attempt],
              },
            },
          }
        }),
      gradeCard: (cardId, grade) =>
        update((prev) => {
          const current = prev.cards[cardId] ?? newCard()
          return { ...prev, cards: { ...prev.cards, [cardId]: review(current, grade) } }
        }),
      dueCards: (cards) => {
        const day = today()
        return cards.filter((c) => {
          const sched = progress.cards[c.id]
          return !sched || isDue(sched, day)
        })
      },
      resetAll: () => update(() => structuredClone(emptyProgress)),
    }),
    [progress, ready, update],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
