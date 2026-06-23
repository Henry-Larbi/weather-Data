import CurriculumTree from '../components/CurriculumTree'
import { useContent } from '../state/ContentContext'

export default function HomePage() {
  const { subjects, loading } = useContent()

  return (
    <div>
      <div className="mb-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
        <h1 className="text-2xl font-bold">Learn Python by doing</h1>
        <p className="mt-1 max-w-2xl text-brand-50">
          Read short lessons, run real Python right in your browser, test yourself
          with quizzes, and lock it in with spaced-repetition flashcards.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading curriculum…</p>
      ) : (
        <CurriculumTree subjects={subjects} />
      )}
    </div>
  )
}
