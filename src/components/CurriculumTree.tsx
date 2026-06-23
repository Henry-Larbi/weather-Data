/**
 * CurriculumTree — the home screen.
 *
 * Lists each subject's modules grouped by level (Beginner → Intermediate →
 * Advanced) with at-a-glance progress: a tick when the lesson is done and the
 * best quiz score so far.
 */
import { Link } from 'react-router-dom'
import type { Level, Module, Subject } from '../types/content'
import { useProgress } from '../state/ProgressContext'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

function ModuleCard({ module }: { module: Module }) {
  const { isLessonComplete, progress } = useProgress()
  const done = isLessonComplete(module.id)
  const quiz = progress.quizzes[module.quiz.id]

  return (
    <Link
      to={`/module/${module.id}`}
      className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">
          {module.title}
        </h3>
        {done && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            ✓ Done
          </span>
        )}
      </div>
      <p className="mt-1 flex-1 text-sm text-slate-600">{module.description}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span>{module.flashcards.length} cards</span>
        <span>·</span>
        <span>{module.quiz.questions.length}-question quiz</span>
        {quiz && (
          <>
            <span>·</span>
            <span className="font-medium text-brand-600">
              Best {quiz.best}/{quiz.total}
            </span>
          </>
        )}
      </div>
    </Link>
  )
}

function SubjectSection({ subject }: { subject: Subject }) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-2xl font-bold text-slate-900">{subject.title}</h2>
      <p className="mb-5 text-slate-600">{subject.description}</p>

      {LEVELS.map((level) => {
        const modules = subject.modules.filter((m) => m.level === level)
        if (modules.length === 0) return null
        return (
          <div key={level} className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {LEVEL_LABEL[level]}
              <span className="h-px flex-1 bg-slate-200" />
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <ModuleCard key={m.id} module={m} />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default function CurriculumTree({ subjects }: { subjects: Subject[] }) {
  return (
    <div>
      {subjects.map((s) => (
        <SubjectSection key={s.id} subject={s} />
      ))}
    </div>
  )
}
