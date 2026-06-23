/**
 * CodePlayground — a CodeMirror editor + a "Run" button backed by Pyodide.
 *
 * Pyodide loads lazily the first time you run code (it's a few MB), so we show
 * a clear "starting Python…" state. Output panes mirror a real terminal:
 * stdout in normal text, stderr/tracebacks in red.
 */
import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { runPython } from '../lib/pyodide'

interface Props {
  /** Initial source shown in the editor. */
  initialCode: string
  /** Optional caption shown above the editor. */
  description?: string
}

export default function CodePlayground({ initialCode, description }: Props) {
  const [code, setCode] = useState(initialCode)
  const [stdout, setStdout] = useState('')
  const [stderr, setStderr] = useState('')
  const [running, setRunning] = useState(false)
  const [booting, setBooting] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  async function handleRun() {
    setRunning(true)
    setHasRun(true)
    // The very first run triggers the Pyodide download/boot.
    setBooting(true)
    try {
      const result = await runPython(code)
      setStdout(result.stdout)
      setStderr(result.stderr)
    } catch (err) {
      setStderr(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
      setBooting(false)
    }
  }

  function handleReset() {
    setCode(initialCode)
    setStdout('')
    setStderr('')
    setHasRun(false)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {description && (
        <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          {description}
        </p>
      )}

      <CodeMirror
        value={code}
        height="auto"
        minHeight="80px"
        extensions={[python()]}
        onChange={setCode}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
        className="text-sm"
      />

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
        <button
          onClick={handleRun}
          disabled={running}
          className="rounded-md bg-brand-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
        >
          {running ? (booting ? 'Starting Python…' : 'Running…') : '▶ Run'}
        </button>
        <button
          onClick={handleReset}
          className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200"
        >
          Reset
        </button>
        <span className="ml-auto text-xs text-slate-400">Python via Pyodide (WASM)</span>
      </div>

      {hasRun && (
        <div className="border-t border-slate-100 bg-slate-900 px-4 py-3 font-mono text-xs">
          {stdout && <pre className="whitespace-pre-wrap text-slate-100">{stdout}</pre>}
          {stderr && <pre className="whitespace-pre-wrap text-red-400">{stderr}</pre>}
          {!stdout && !stderr && !running && (
            <span className="text-slate-500">(no output)</span>
          )}
        </div>
      )}
    </div>
  )
}
