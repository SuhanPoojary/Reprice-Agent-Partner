import React from 'react'
import { LogOut, Wifi } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BrandMark } from './BrandMark'

export function AgentShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <BrandMark subtitle="Agent" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-600">
              <Wifi className="h-4 w-4" /> Live-ready
            </div>
            <button
              className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
              onClick={logout}
            >
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Logout
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">{children}</div>
    </div>
  )
}
