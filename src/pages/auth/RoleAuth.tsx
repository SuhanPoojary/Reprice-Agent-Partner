import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useAuth, type Role } from '../../context/AuthContext'

type Mode = 'login' | 'signup'
type Variant = 'page' | 'modal'

export default function RoleAuth({ role, variant = 'page' }: { role: Role; variant?: Variant }) {
  const navigate = useNavigate()
  const {
    loginAgentWithPassword,
    loginPartnerWithPassword,
    signupAgentWithPassword,
    signupPartnerWithPassword,
  } = useAuth()

  const canSignup = role !== 'agent'

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveMode: Mode = canSignup ? mode : 'login'

  const title = useMemo(() => {
    return effectiveMode === 'login' ? 'Welcome Back!' : 'Create Account'
  }, [effectiveMode])

  const portalLabel = role === 'agent' ? 'Agent Portal' : 'Partner Portal'

  const afterAuthNavigateTo = role === 'agent' ? '/agent' : '/partner'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const normalizedPhone = phone.trim()

      if (effectiveMode === 'login') {
        if (role === 'agent') {
          await loginAgentWithPassword(normalizedPhone, password)
        } else {
          await loginPartnerWithPassword(normalizedPhone, password)
        }
      } else {
        if (!name.trim()) {
          setError('Please enter your name.')
          return
        }

        const normalizedEmail = email.trim() || undefined

        await signupPartnerWithPassword(name.trim(), normalizedPhone, password, normalizedEmail)
      }

      navigate(afterAuthNavigateTo)
    } catch (err: any) {
      setError(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <Card className="overflow-hidden border-0 shadow-2xl">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2">
          {/* Left side */}
          <div className="hidden md:block relative bg-gradient-to-br from-blue-600 to-indigo-700">
            <div className="absolute inset-0 bg-[url('/images/auth.jpg')] bg-cover bg-center opacity-20" />
            <div className="relative h-full flex items-center justify-center p-8">
              <div className="text-center text-white">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Welcome to MobileTrade</h2>
                <p className="text-lg text-blue-100">Get the best price for your old phone with our hassle-free service</p>

                <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                    <span className="text-sm">Best market prices</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                    <span className="text-sm">Free doorstep pickup</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                    <span className="text-sm">Instant payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="p-8 bg-white max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 text-center">{portalLabel}</div>
              <div className="text-2xl font-bold text-center text-slate-900 mt-2">{title}</div>
              <div className="text-center text-slate-500 mt-2">
                {effectiveMode === 'login' ? 'Sign in to continue' : 'Join us today'}
              </div>
            </div>

            {/* Toggle */}
            {canSignup ? (
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                  }}
                  className={`flex-1 pb-2 text-center font-medium transition-all border-b-2 ${
                    mode === 'login'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className={`flex-1 pb-2 text-center font-medium transition-all border-b-2 ${
                    mode === 'signup'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              {effectiveMode === 'signup' ? (
                <div className="space-y-2">
                  <div className="text-slate-700 font-medium text-sm">Full Name *</div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="h-11 pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="text-slate-700 font-medium text-sm">Phone Number *</div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="h-11 pl-10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 Enter your Mobile"
                    required
                  />
                </div>
              </div>

              {effectiveMode === 'signup' ? (
                <div className="space-y-2">
                  <div className="text-slate-700 font-medium text-sm">Email (Optional)</div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="h-11 pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      type="email"
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="text-slate-700 font-medium text-sm">Password *</div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="h-11 pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30"
              >
                {loading
                  ? effectiveMode === 'login'
                    ? 'Signing in…'
                    : 'Creating account…'
                  : effectiveMode === 'login'
                    ? 'LOGIN'
                    : 'CREATE ACCOUNT'}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (variant === 'modal') {
    return <div className="w-full">{content}</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="w-full max-w-4xl px-4">
          <div className="mb-4">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
          </div>
          {content}
        </div>
      </main>
    </div>
  )
}
