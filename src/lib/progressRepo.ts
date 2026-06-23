/**
 * Progress repository.
 *
 * Loads and saves the learner's `ProgressState`. Strategy:
 *   - Signed in + Supabase configured  -> `progress` table, row per user.
 *   - Otherwise                         -> localStorage (guest mode).
 *
 * The app always keeps a localStorage copy too, so progress survives a refresh
 * even mid-sign-in and we can merge it up to the cloud on first login.
 */
import type { ProgressState } from '../types/progress'
import { emptyProgress } from '../types/progress'
import { isSupabaseConfigured, supabase } from './supabase'

const LOCAL_KEY = 'pylearn.progress.v1'

function readLocal(): ProgressState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return structuredClone(emptyProgress)
    return { ...structuredClone(emptyProgress), ...(JSON.parse(raw) as ProgressState) }
  } catch {
    return structuredClone(emptyProgress)
  }
}

function writeLocal(state: ProgressState): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
}

/** Load progress for the given user (or guest when userId is null). */
export async function loadProgress(userId: string | null): Promise<ProgressState> {
  const local = readLocal()

  if (!userId || !isSupabaseConfigured || !supabase) {
    return local
  }

  const { data, error } = await supabase
    .from('progress')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[progressRepo] Cloud load failed, using local copy:', error)
    return local
  }

  if (!data) {
    // First time signing in on this account: push up whatever is local.
    await saveProgress(userId, local)
    return local
  }

  const cloud = { ...structuredClone(emptyProgress), ...(data.state as ProgressState) }
  writeLocal(cloud)
  return cloud
}

/** Persist progress. Always writes locally; also to the cloud when signed in. */
export async function saveProgress(userId: string | null, state: ProgressState): Promise<void> {
  writeLocal(state)

  if (!userId || !isSupabaseConfigured || !supabase) return

  const { error } = await supabase
    .from('progress')
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() })

  if (error) console.warn('[progressRepo] Cloud save failed (kept locally):', error)
}
