import React from 'react'
import { LogOut, MapPin, Users, BarChart3, Package } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { BrandMark } from './BrandMark'

export type PartnerTab = 'orders' | 'agents' | 'stats' | 'take-orders'

export function PartnerShell({
  tab,
  setTab,
  children,
}: {
  tab: PartnerTab
  setTab: (t: PartnerTab) => void
  children: React.ReactNode
}) {
  const { logout } = useAuth()

  const item = (id: PartnerTab, label: string, icon: React.ReactNode) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={cn(
        'w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        tab === id ? 'bg-brand-50 text-brand-800 border border-brand-100' : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <aside className="rounded-2xl border bg-white shadow-soft p-4 h-fit lg:sticky lg:top-4">
            <BrandMark subtitle="Partner Dashboard" />

            <div className="mt-4 space-y-2">
              {item('orders', 'Orders', <MapPin className="h-4 w-4" />)}
              {item('take-orders', 'Take Orders', <Package className="h-4 w-4" />)}
              {item('agents', 'Agents', <Users className="h-4 w-4" />)}
              {item('stats', 'Performance', <BarChart3 className="h-4 w-4" />)}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
