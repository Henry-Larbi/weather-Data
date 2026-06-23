/**
 * FlashcardsPage — a single review session across every module's cards.
 */
import { useContent } from '../state/ContentContext'
import FlashcardDeck from '../components/FlashcardDeck'
import type { DueCard } from '../state/ProgressContext'

export default function FlashcardsPage() {
  const { allModules, loading } = useContent()

  if (loading) return <p className="text-slate-500">Loading…</p>

  const everyCard: DueCard[] = allModules.flatMap((m) =>
    m.flashcards.map((c) => ({ ...c, moduleId: m.id })),
  )

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Flashcard review</h1>
      <p className="mb-6 text-slate-600">
        Cards due across every topic, scheduled with spaced repetition.
      </p>
      <FlashcardDeck cards={everyCard} />
    </div>
  )
}
