/**
 * Content repository.
 *
 * Single place the app asks for learning content. When Supabase is configured
 * it serves content from the `subjects` and `modules` tables; otherwise it
 * returns the bundled manifest. Either way the caller gets the same
 * `Subject[]` shape, so components never know or care where content came from.
 *
 * Cloud schema: each module is stored as a row whose `data` column is the full
 * Module JSON (jsonb). This keeps the DB faithful to our "content as data"
 * model — the sync script just upserts the JSON files verbatim.
 */
import type { Module, Subject } from '../types/content'
import { subjects as localSubjects } from '../content/manifest'
import { isSupabaseConfigured, supabase } from './supabase'

interface SubjectRow {
  id: string
  title: string
  description: string
  position: number
}

interface ModuleRow {
  id: string
  subject_id: string
  position: number
  data: Module
}

/** Load all subjects (with their modules), from Supabase or the local manifest. */
export async function loadSubjects(): Promise<Subject[]> {
  if (!isSupabaseConfigured || !supabase) {
    return localSubjects
  }

  const [{ data: subjectRows, error: subjErr }, { data: moduleRows, error: modErr }] =
    await Promise.all([
      supabase.from('subjects').select('*').order('position'),
      supabase.from('modules').select('*').order('position'),
    ])

  // If the cloud read fails for any reason, degrade gracefully to local content
  // rather than showing an empty app.
  if (subjErr || modErr || !subjectRows || !moduleRows) {
    console.warn('[contentRepo] Falling back to local content:', subjErr || modErr)
    return localSubjects
  }

  const modulesBySubject = new Map<string, Module[]>()
  for (const row of moduleRows as ModuleRow[]) {
    const list = modulesBySubject.get(row.subject_id) ?? []
    list.push(row.data)
    modulesBySubject.set(row.subject_id, list)
  }

  return (subjectRows as SubjectRow[]).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    modules: modulesBySubject.get(s.id) ?? [],
  }))
}
