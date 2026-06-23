/**
 * Pyodide loader + runner.
 *
 * Pyodide (CPython compiled to WebAssembly) is large, so we:
 *   - load it lazily from the official CDN the first time code is run, and
 *   - reuse a single interpreter instance across runs.
 *
 * `runPython` captures stdout and stderr by redirecting them to JS callbacks,
 * so the playground can show exactly what a real `python` session would print.
 */

const PYODIDE_VERSION = 'v0.26.2'
const CDN_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

// Minimal typing for the bits of the Pyodide API we use.
interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>
  setStdout: (opts: { batched: (s: string) => void }) => void
  setStderr: (opts: { batched: (s: string) => void }) => void
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInterface>
  }
}

let pyodidePromise: Promise<PyodideInterface> | null = null

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

/** Get (and lazily initialise) the shared Pyodide interpreter. */
export function getPyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await injectScript(`${CDN_BASE}pyodide.js`)
      if (!window.loadPyodide) throw new Error('Pyodide failed to load')
      return window.loadPyodide({ indexURL: CDN_BASE })
    })()
  }
  return pyodidePromise
}

export interface RunResult {
  stdout: string
  stderr: string
  /** True if execution raised an uncaught exception. */
  error: boolean
}

/** Run a Python snippet and capture stdout/stderr as a real session would. */
export async function runPython(code: string): Promise<RunResult> {
  const py = await getPyodide()
  let stdout = ''
  let stderr = ''

  py.setStdout({ batched: (s) => (stdout += s + '\n') })
  py.setStderr({ batched: (s) => (stderr += s + '\n') })

  try {
    await py.runPythonAsync(code)
    return { stdout, stderr, error: false }
  } catch (err) {
    // Pyodide surfaces Python tracebacks as the JS error message.
    stderr += (err instanceof Error ? err.message : String(err)) + '\n'
    return { stdout, stderr, error: true }
  }
}
