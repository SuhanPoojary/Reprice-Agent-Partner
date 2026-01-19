import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Button } from './ui/Button'
import { useAuth } from '../context/AuthContext'

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const dashboardPath = user?.role === 'agent' ? '/agent' : user?.role === 'partner' ? '/partner' : null

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? 'U'
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
    return (first + last).toUpperCase()
  }, [user?.name])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="MobileTrade" className="h-8 w-8 rounded-full" />
          <span className="text-lg font-bold tracking-tight text-brand-600">MobileTrade</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors">
            Home
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors">
            How It Works
          </Link>
          <Link to="/about-us" className="text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors">
            Contact
          </Link>
          {dashboardPath ? (
            <Link to={dashboardPath} className="text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors">
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  <div className="h-7 w-7 rounded-full bg-brand-600 text-white grid place-items-center text-xs font-bold">
                    {userInitials}
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-slate-900 max-w-[160px] truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize">{user.role}</div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>

              {/* Mobile */}
              <Button
                variant="secondary"
                className="sm:hidden"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="secondary" className="hidden sm:inline-flex">
                <Link to="/loginto">
                  <User className="h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white hidden sm:inline-flex">
                <Link to="/contact">Contact</Link>
              </Button>

              {/* Mobile */}
              <Button asChild variant="secondary" className="sm:hidden">
                <Link to="/loginto">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
