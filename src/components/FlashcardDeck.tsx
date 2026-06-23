/**
 * FlashcardDeck — a spaced-repetition review session.
 *
 * On mount it snapshots which of the supplied cards are due today, then walks
 * through them: show front, flip to reveal the back, grade with one of four
 * buttons. Each grade reschedules the card (SM-2) via progress. The snapshot
 * means grading a card doesn't yank it out of the current session mid-review.
 */
import { useMemo, useState } from 'react'
import { useProgress, type DueCard } from '../state/ProgressContext'
import type { Grade } from '../lib/srs'
import Markdown from './Markdown'

interface Props {
  cards: DueCard[]
}

const GRADE_BUTTONS: Array<{ grade: Grade; label: string; style: string }> = [
  { grade: 'again', label: 'Again', style: 'bg-red-100 text-red-700 hover:bg-red-200' },
  { grade: 'hard', label: 'Hard', style: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { grade: 'good', label: 'Good', style: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { grade: 'easy', label: 'Easy', style: 'bg-brand-100 text-brand-700 hover:bg-brand-200' },
]

export default function FlashcardDeck({ cards }: Props) {
  const { dueCards, gradeCard } = useProgress()
  // Snapshot the due queue once for this session.
  const queue = useMemo(() => dueCards(cards), [cards]) // eslint-disable-line react-hooks/exhaustive-deps
  const [position, setPosition] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  if (queue.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 font-medium text-slate-800">No cards due right now</p>
        <p className="mt-1 text-sm text-slate-500">
          Come back later — reviews are scheduled with spaced repetition.
        </p>
      </div>
    )
  }

  if (position >= queue.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-medium text-slate-800">
          Session complete — {reviewed} card{reviewed === 1 ? '' : 's'} reviewed
        </p>
        <p className="mt-1 text-sm text-slate-500">Your schedule has been updated.</p>
      </div>
    )
  }

  const card = queue[position]

  function grade(g: Grade) {
    gradeCard(card.id, g)
    setReviewed((n) => n + 1)
    setPosition((p) => p + 1)
    setFlipped(false)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>
          Card {position + 1} of {queue.length}
        </span>
        <span>{queue.length - position} left</span>
      </div>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:shadow"
      >
        <div className="text-lg text-slate-900">
          <Markdown>{flipped ? card.back : card.front}</Markdown>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
          {flipped ? 'Answer' : 'Click to reveal'}
        </p>
      </div>

      {flipped && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GRADE_BUTTONS.map((b) => (
            <button
              key={b.grade}
              onClick={() => grade(b.grade)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${b.style}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
