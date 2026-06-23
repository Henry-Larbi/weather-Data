-- PyLearn Supabase schema
-- ------------------------
-- Run this in the Supabase SQL editor (or `supabase db` / psql) once per project.
-- It creates three tables:
--   subjects, modules  -> the curriculum content (publicly readable)
--   progress           -> per-user learning progress (private to each user)
--
-- Content is stored "as data": each module row keeps the full Module JSON in a
-- jsonb `data` column, matching the app's content model exactly. The
-- `npm run sync:content` script upserts the JSON files into these tables.

-- ---------- Content tables ----------

create table if not exists public.subjects (
  id          text primary key,
  title       text not null,
  description text not null default '',
  position    int  not null default 0
);

create table if not exists public.modules (
  id         text primary key,
  subject_id text not null references public.subjects (id) on delete cascade,
  position   int  not null default 0,
  data       jsonb not null
);

create index if not exists modules_subject_idx on public.modules (subject_id);

-- Content is public read-only. Writes happen only via the service-role key
-- (used by the sync script), which bypasses RLS.
alter table public.subjects enable row level security;
alter table public.modules  enable row level security;

drop policy if exists "subjects are readable by everyone" on public.subjects;
create policy "subjects are readable by everyone"
  on public.subjects for select
  to anon, authenticated
  using (true);

drop policy if exists "modules are readable by everyone" on public.modules;
create policy "modules are readable by everyone"
  on public.modules for select
  to anon, authenticated
  using (true);

-- ---------- Per-user progress ----------

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- Each user can only read and write their own progress row.
drop policy if exists "read own progress" on public.progress;
create policy "read own progress"
  on public.progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own progress" on public.progress;
create policy "insert own progress"
  on public.progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own progress" on public.progress;
create policy "update own progress"
  on public.progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
