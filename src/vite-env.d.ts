/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. If unset, the app runs in local/offline mode. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon (public) key. Safe to ship in a client bundle. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
