/**
 * Content context.
 *
 * Loads all subjects (from Supabase or the local manifest) once on startup and
 * exposes simple lookups. Components consume content from here so they never
 * import the manifest directly — that keeps the cloud/local switch invisible.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Module, Subject } from '../types/content'
import { loadSubjects } from '../lib/contentRepo'

interface ContentContextValue {
  subjects: Subject[]
  loading: boolean
  /** All modules flattened with their owning subject id. */
  allModules: Array<Module & { subjectId: string }>
  findModule: (moduleId: string) => (Module & { subjectId: string }) | undefined
}

const ContentContext = createContext<ContentContextValue | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadSubjects().then((s) => {
      if (!cancelled) {
        setSubjects(s)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<ContentContextValue>(() => {
    const allModules = subjects.flatMap((s) =>
      s.modules.map((m) => ({ ...m, subjectId: s.id })),
    )
    return {
      subjects,
      loading,
      allModules,
      findModule: (moduleId) => allModules.find((m) => m.id === moduleId),
    }
  }, [subjects, loading])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within a ContentProvider')
  return ctx
}
