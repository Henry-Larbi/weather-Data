/**
 * Lazy wrapper around CodePlayground.
 *
 * CodeMirror + Pyodide glue is the heaviest part of the bundle but is only
 * needed on lesson and playground pages, so we code-split it behind React.lazy.
 * This keeps the initial load (home, dashboard, quizzes) lean.
 */
import { lazy, Suspense } from 'react'

const CodePlayground = lazy(() => import('./CodePlayground'))

interface Props {
  initialCode: string
  description?: string
}

export default function LazyPlayground(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
          Loading editor…
        </div>
      }
    >
      <CodePlayground {...props} />
    </Suspense>
  )
}
