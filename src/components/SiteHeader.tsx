import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { Button } from './ui/Button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Truck className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">FleetFlow</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">
            Portal
          </Link>
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
            Features
          </Link>
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link to="/login">Open Portal</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
