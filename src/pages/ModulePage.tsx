/**
 * ModulePage — a single topic with three tabs: Lesson, Quiz, Flashcards.
 * The tab lives in the URL hash so links/refreshes keep their place.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useContent } from '../state/ContentContext'
import { useProgress, type DueCard } from '../state/ProgressContext'
import LessonViewer from '../components/LessonViewer'
import QuizRunner from '../components/QuizRunner'
import FlashcardDeck from '../components/FlashcardDeck'

type Tab = 'lesson' | 'quiz' | 'flashcards'
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'lesson', label: 'Lesson' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'flashcards', label: 'Flashcards' },
]

export default function ModulePage() {
  const { moduleId = '' } = useParams()
  const { findModule, loading } = useContent()
  const { dueCards } = useProgress()
  const [tab, setTab] = useState<Tab>('lesson')

  if (loading) return <p className="text-slate-500">Loading…</p>

  const module = findModule(moduleId)
  if (!module) {
    return (
      <div>
        <p className="text-slate-700">Module not found.</p>
        <Link to="/" className="text-brand-600 underline">
          ← Back to curriculum
        </Link>
      </div>
    )
  }

  const cards: DueCard[] = module.flashcards.map((c) => ({ ...c, moduleId: module.id }))
  const dueCount = dueCards(cards).length

  return (
    <div>
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← Curriculum
      </Link>

      <div className="mt-3 mb-5 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.id === 'flashcards' && dueCount > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-xs text-brand-700">
                {dueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'lesson' && <LessonViewer moduleId={module.id} lesson={module.lesson} />}
      {tab === 'quiz' && <QuizRunner quiz={module.quiz} />}
      {tab === 'flashcards' && <FlashcardDeck cards={cards} />}
    </div>
  )
}
