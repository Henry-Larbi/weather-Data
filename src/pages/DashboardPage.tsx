import ProgressDashboard from '../components/ProgressDashboard'
import { useContent } from '../state/ContentContext'

export default function DashboardPage() {
  const { loading } = useContent()
  if (loading) return <p className="text-slate-500">Loading…</p>
  return <ProgressDashboard />
}
