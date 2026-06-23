# PyLearn

A content-driven web app that teaches **Python from beginner to advanced**.
Read short lessons, run **real Python in the browser** (via Pyodide / WebAssembly),
test yourself with quizzes, and lock it in with **spaced-repetition flashcards**.

All learning content lives in JSON, so you can add topics — or whole new
subjects — without touching app code.

## Features

- **Curriculum tree** grouped by level (Beginner → Intermediate → Advanced) with progress indicators.
- **Lessons** in Markdown with syntax-highlighted code blocks and embedded runnable examples.
- **Code playground** — a CodeMirror editor + Run button that executes Python in the browser with no backend.
- **Quizzes** — multiple-choice and "predict the output", with immediate feedback and saved scores.
- **Flashcards** — lightweight SM-2 spaced repetition.
- **Progress dashboard** — % complete per topic, quiz history, and cards due today.
- **Cloud storage (Supabase)** — content served from Postgres and per-user progress synced across devices. Falls back to bundled JSON + `localStorage` when not configured.

## Tech stack

React + Vite + TypeScript · Tailwind CSS · React Router · Pyodide (CPython in WASM) ·
CodeMirror · Supabase (Postgres + Auth).

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The app runs **with zero configuration** in local mode (content from the bundled
JSON, progress in `localStorage`).

### Build

```bash
npm run build      # type-checks then builds to dist/
npm run preview    # serve the production build
```

## Enabling cloud storage (Supabase)

By default everything is local. To turn on cloud content + per-user progress sync:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) to create the
   `subjects`, `modules`, and `progress` tables (with row-level security).
3. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API),
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; used solely by the sync script).
4. Push the JSON content into Supabase:

   ```bash
   npm run sync:content
   ```

5. `npm run dev` — the app now reads content from Supabase, and signing in
   (top-right) syncs progress to your account. Re-run `sync:content` whenever you
   edit content.

> Without a `.env`, all of the above is skipped and the app uses local data —
> handy for demos and offline work.

## Project structure

```
src/
  types/        # Lesson, Quiz, Question, Flashcard, Module, Subject, Progress
  content/      # ← all learning content (JSON) + subjects.json + manifest.ts
  lib/          # supabase client, content/progress repos, srs, pyodide loader
  state/        # Auth, Content, Progress React contexts
  components/   # LessonViewer, QuizRunner, CodePlayground, FlashcardDeck, ProgressDashboard, ...
  pages/        # routed screens
supabase/schema.sql
scripts/sync-content.mjs
```

## Adding content

See **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)** — adding a topic is a new JSON file
plus one registry entry. The architecture is subject-agnostic, so a future
subject (e.g. "Math") is just another content folder.
