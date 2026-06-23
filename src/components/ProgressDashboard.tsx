/**
 * ProgressDashboard — overview of how the learner is doing:
 *   - % of lessons complete per subject,
 *   - quiz history (best scores + attempts),
 *   - how many flashcards are due today.
 */
import { Link } from 'react-router-dom'
import { useContent } from '../state/ContentContext'
import { useProgress, type DueCard } from '../state/ProgressContext'

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

export default function ProgressDashboard() {
  const { subjects, allModules } = useContent()
  const { progress, isLessonComplete, dueCards } = useProgress()

  // Flatten every flashcard across modules, then ask which are due today.
  const everyCard: DueCard[] = allModules.flatMap((m) =>
    m.flashcards.map((c) => ({ ...c, moduleId: m.id })),
  )
  const due = dueCards(everyCard)

  const quizEntries = Object.entries(progress.quizzes)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Your progress</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Cards due today</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{due.length}</p>
          {due.length > 0 && (
            <Link to="/flashcards" className="mt-1 inline-block text-sm text-brand-600 underline">
              Review now →
            </Link>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Lessons completed</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {Object.values(progress.lessonsCompleted).filter(Boolean).length}
            <span className="text-lg text-slate-400"> / {allModules.length}</span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Quizzes attempted</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{quizEntries.length}</p>
        </div>
      </div>

      {/* Per-subject completion */}
      {subjects.map((subject) => {
        const total = subject.modules.length
        const done = subject.modules.filter((m) => isLessonComplete(m.id)).length
        const percent = pct(done, total)
        return (
          <section key={subject.id}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{subject.title}</h2>
              <span className="text-sm text-slate-500">
                {done}/{total} lessons · {percent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </section>
        )
      })}

      {/* Quiz history */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Quiz history</h2>
        {quizEntries.length === 0 ? (
          <p className="text-sm text-slate-500">
            No quizzes yet. Open a module and take its quiz to see scores here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Quiz</th>
                  <th className="px-4 py-2 font-medium">Best</th>
                  <th className="px-4 py-2 font-medium">Attempts</th>
                  <th className="px-4 py-2 font-medium">Last taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizEntries.map(([quizId, record]) => {
                  const last = record.attempts[record.attempts.length - 1]
                  const module = allModules.find((m) => m.quiz.id === quizId)
                  return (
                    <tr key={quizId}>
                      <td className="px-4 py-2 text-slate-800">
                        {module?.quiz.title ?? quizId}
                      </td>
                      <td className="px-4 py-2 font-medium text-brand-600">
                        {record.best}/{record.total}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{record.attempts.length}</td>
                      <td className="px-4 py-2 text-slate-500">
                        {last ? new Date(last.at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
