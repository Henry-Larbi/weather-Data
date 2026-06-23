/**
 * Supabase client singleton.
 *
 * The client is only created when both env vars are present. Everywhere else in
 * the app we guard on `isSupabaseConfigured` and fall back to local content +
 * localStorage progress when it's false. This means the app runs with zero
 * configuration (great for demos / first run) and transparently upgrades to
 * cloud storage once you add a `.env` (see .env.example).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
