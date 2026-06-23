/**
 * Authentication context.
 *
 * Wraps Supabase email/password auth. When Supabase isn't configured the app
 * still works fully in "guest" mode (progress saved to localStorage) — the auth
 * UI just advertises that signing in enables cross-device sync.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export interface AuthUser {
  id: string
  email: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** True when cloud auth is available at all. */
  cloudEnabled: boolean
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    // Seed from any persisted session, then subscribe to changes.
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      cloudEnabled: isSupabaseConfigured,
      async signUp(email, password) {
        if (!supabase) return { error: 'Cloud sync is not configured.' }
        const { error } = await supabase.auth.signUp({ email, password })
        return error ? { error: error.message } : {}
      },
      async signIn(email, password) {
        if (!supabase) return { error: 'Cloud sync is not configured.' }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? { error: error.message } : {}
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
