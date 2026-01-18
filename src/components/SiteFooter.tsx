import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">FleetFlow</p>
            <p className="mt-2 text-sm text-slate-600 max-w-md">
              A modern agent & partner operations portal for pickups, assignments, and real-time status.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/login" className="hover:text-slate-900">
                  Portal
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-slate-900">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/" className="hover:text-slate-900">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-slate-900">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FleetFlow. All rights reserved.</p>
          <p>Built for agent/partner logistics workflows.</p>
        </div>
      </div>
    </footer>
  )
}
