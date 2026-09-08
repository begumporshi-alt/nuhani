import { Link } from 'react-router-dom'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

export default function AdminBackLink() {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-mink-500 transition-colors mb-4"
    >
      <ArrowLeft size={16} />
      <LayoutDashboard size={16} />
      Back to Dashboard
    </Link>
  )
}
