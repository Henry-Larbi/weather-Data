/**
 * Content manifest.
 *
 * `subjects.json` is the canonical registry of subjects and the order of their
 * modules. To add a new topic you:
 *   1. Create a module JSON under `src/content/<subject>/` (see CONTENT_GUIDE.md).
 *   2. Import it below and add it to `moduleFiles`.
 *   3. Add its id to that subject's `modules` array in `subjects.json`.
 *
 * The JSON files are the *authoring source of truth*. At runtime the app reads
 * content from Supabase when configured (see src/lib/contentRepo.ts); this
 * manifest is both the offline fallback and the input to the content sync
 * script (`npm run sync:content`), which uploads it to Supabase.
 *
 * The architecture is subject-agnostic: Python is just the first subject.
 */
import type { Module, Subject } from '../types/content'
import subjectsMeta from './subjects.json'

// Python modules. Keyed by module id so subjects.json controls ordering.
import variables from './python/variables.json'
import strings from './python/strings.json'
import listsDicts from './python/lists-dicts.json'
import conditionals from './python/conditionals.json'
import loops from './python/loops.json'
import functions from './python/functions.json'

// Registry of every bundled module file, by id. Add new files here.
const moduleFiles: Record<string, Module> = {
  variables: variables as Module,
  strings: strings as Module,
  'lists-dicts': listsDicts as Module,
  conditionals: conditionals as Module,
  loops: loops as Module,
  functions: functions as Module,
}

interface SubjectMeta {
  id: string
  title: string
  description: string
  dir: string
  modules: string[]
}

export const subjects: Subject[] = (subjectsMeta as SubjectMeta[]).map((meta) => ({
  id: meta.id,
  title: meta.title,
  description: meta.description,
  modules: meta.modules.map((id) => {
    const m = moduleFiles[id]
    if (!m) throw new Error(`Module "${id}" listed in subjects.json but not imported in manifest.ts`)
    return m
  }),
}))

/** Convenience lookup: subjectId -> Subject. */
export const subjectsById: Record<string, Subject> = Object.fromEntries(
  subjects.map((s) => [s.id, s]),
)

/** Flatten every module across subjects, tagged with its subject id. */
export const allModules: Array<Module & { subjectId: string }> = subjects.flatMap((s) =>
  s.modules.map((m) => ({ ...m, subjectId: s.id })),
)
