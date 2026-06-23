#!/usr/bin/env node
/**
 * Content sync: push the local JSON curriculum into Supabase.
 *
 * Reads `src/content/subjects.json` and each referenced module JSON, then
 * upserts rows into the `subjects` and `modules` tables. Uses the service-role
 * key so it can write past row-level security.
 *
 * Usage:
 *   1. Put VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`.
 *   2. npm run sync:content
 *
 * Re-run any time you add or edit content — upserts are idempotent.
 */
import { readFile } from 'node:fs/promises'
import { existsSync, readFileSync as readFileSyncRaw } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const contentDir = join(root, 'src', 'content')

// --- tiny .env loader (so you don't need extra deps) ---
function loadEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  const text = readFileSyncRaw(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Add them to .env (see .env.example) and try again.',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function main() {
  const subjects = await readJson(join(contentDir, 'subjects.json'))

  const subjectRows = []
  const moduleRows = []

  for (const [subjectIndex, subject] of subjects.entries()) {
    subjectRows.push({
      id: subject.id,
      title: subject.title,
      description: subject.description,
      position: subjectIndex,
    })

    for (const [moduleIndex, moduleId] of subject.modules.entries()) {
      const data = await readJson(join(contentDir, subject.dir, `${moduleId}.json`))
      moduleRows.push({
        id: data.id,
        subject_id: subject.id,
        position: moduleIndex,
        data,
      })
    }
  }

  console.log(`Upserting ${subjectRows.length} subject(s) and ${moduleRows.length} module(s)…`)

  const { error: subjErr } = await supabase.from('subjects').upsert(subjectRows)
  if (subjErr) throw subjErr

  const { error: modErr } = await supabase.from('modules').upsert(moduleRows)
  if (modErr) throw modErr

  console.log('✓ Content synced to Supabase.')
}

main().catch((err) => {
  console.error('Sync failed:', err.message ?? err)
  process.exit(1)
})
