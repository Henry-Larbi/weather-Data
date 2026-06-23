/**
 * PlaygroundPage — a standalone scratchpad for running Python, independent of
 * any lesson. Handy for experimenting.
 */
import LazyPlayground from '../components/LazyPlayground'

const STARTER = `# Scratchpad — write any Python and press Run.
for i in range(1, 6):
    print(i, "squared is", i * i)
`

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Playground</h1>
      <p className="mb-6 text-slate-600">
        A full Python interpreter running in your browser via Pyodide. The first
        run downloads Python (~a few MB), then it's instant.
      </p>
      <LazyPlayground initialCode={STARTER} />
    </div>
  )
}
