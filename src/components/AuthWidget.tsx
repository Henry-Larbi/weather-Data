/**
 * AuthWidget — compact sign-in / account control for the header.
 *
 * When signed in: shows the email + a sign-out button.
 * When signed out (cloud enabled): a small sign-in / sign-up popover.
 * When cloud isn't configured: a quiet "Guest" badge explaining the situation.
 */
import { useState } from 'react'
import { useAuth } from '../state/AuthContext'

export default function AuthWidget() {
  const { user, cloudEnabled, signIn, signUp, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  if (!cloudEnabled) {
    return (
      <span
        title="Add a Supabase .env to enable cross-device sync. Progress is saved locally for now."
        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500"
      >
        Guest (local)
      </span>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-slate-500 sm:inline">{user.email}</span>
        <button
          onClick={() => signOut()}
          className="rounded-md border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    const fn = mode === 'in' ? signIn : signUp
    const { error } = await fn(email, password)
    setBusy(false)
    if (error) {
      setError(error)
    } else if (mode === 'up') {
      setNotice('Account created. Check your email if confirmation is required, then sign in.')
      setMode('in')
    } else {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
      >
        Sign in
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex gap-2 text-sm">
            <button
              onClick={() => setMode('in')}
              className={mode === 'in' ? 'font-semibold text-brand-600' : 'text-slate-500'}
            >
              Sign in
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setMode('up')}
              className={mode === 'up' ? 'font-semibold text-brand-600' : 'text-slate-500'}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-2">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            {notice && <p className="text-xs text-emerald-600">{notice}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <p className="mt-2 text-[11px] leading-snug text-slate-400">
            Signing in syncs your progress across devices via Supabase.
          </p>
        </div>
      )}
    </div>
  )
}
