/**
 * Layout — app shell with the top navigation bar and a content container.
 * Uses React Router's <Outlet> to render the active page.
 */
import { NavLink, Link, Outlet } from 'react-router-dom'
import AuthWidget from './AuthWidget'

const NAV = [
  { to: '/', label: 'Learn', end: true },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/playground', label: 'Playground' },
  { to: '/dashboard', label: 'Progress' },
]

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 font-mono text-sm text-accent-500">
              Py
            </span>
            PyLearn
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 ${
                    isActive
                      ? 'bg-brand-50 font-medium text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto">
            <AuthWidget />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
