/**
 * LessonViewer — renders a lesson's Markdown body and its runnable examples,
 * each of which opens inline in a CodePlayground. Also exposes a
 * "mark complete" toggle wired to progress.
 */
import type { Lesson } from '../types/content'
import { useProgress } from '../state/ProgressContext'
import Markdown from './Markdown'
import LazyPlayground from './LazyPlayground'

interface Props {
  moduleId: string
  lesson: Lesson
}

export default function LessonViewer({ moduleId, lesson }: Props) {
  const { isLessonComplete, markLessonComplete } = useProgress()
  const complete = isLessonComplete(moduleId)

  return (
    <article>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
        <p className="mt-1 text-slate-600">{lesson.summary}</p>
        {lesson.estimatedMinutes != null && (
          <p className="mt-1 text-xs text-slate-400">~{lesson.estimatedMinutes} min</p>
        )}
      </header>

      <Markdown>{lesson.body}</Markdown>

      {lesson.examples && lesson.examples.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Try it yourself
          </h2>
          <div className="space-y-5">
            {lesson.examples.map((ex, i) => (
              <div key={i}>
                <h3 className="mb-2 text-sm font-medium text-slate-700">{ex.title}</h3>
                <LazyPlayground initialCode={ex.code} description={ex.description} />
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-4">
        <button
          onClick={() => markLessonComplete(moduleId, !complete)}
          className={
            complete
              ? 'rounded-md bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200'
              : 'rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600'
          }
        >
          {complete ? '✓ Completed — mark as not done' : 'Mark lesson complete'}
        </button>
      </footer>
    </article>
  )
}
