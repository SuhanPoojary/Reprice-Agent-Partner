import { Link } from 'react-router-dom'
import { UserRound, Users, ArrowRight } from 'lucide-react'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { Button } from '../components/ui/Button'

export default function LoginTo() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-grow">
        <section className="relative overflow-hidden bg-slate-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(12,102,228,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.16),transparent_55%)]" />
          <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-4 py-2 text-sm font-semibold border border-brand-100">
                Choose your portal
              </div>
              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
                Login to MobileTrade Ops
              </h1>
              <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
                Select your role to continue. Partners manage assignments and agents; agents manage pickup execution.
              </p>
            </div>

            <div className="mt-10">
              <div className="rounded-[28px] border bg-white/80 backdrop-blur-xl shadow-soft overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <RoleCard
                    title="Partner"
                    subtitle="Assign orders • Manage agents"
                    icon={<Users className="h-6 w-6" />}
                    imageSrc="/images/slider1.jpg"
                    to="/partner/login"
                    cta="Open Partner Login"
                  />
                  <RoleCard
                    title="Agent"
                    subtitle="Navigate • Update status"
                    icon={<UserRound className="h-6 w-6" />}
                    imageSrc="/images/slider2.jpg"
                    to="/agent/login"
                    cta="Open Agent Login"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary" className="h-11 px-5">
                  <Link to="/how-it-works">How it works</Link>
                </Button>
                <Button asChild className="h-11 px-5 bg-brand-600 hover:bg-brand-700 text-white">
                  <Link to="/contact">Contact support</Link>
                </Button>
              </div>

              <div className="mt-4 text-xs text-slate-500 text-center">
                Don’t have access? Contact your partner admin.
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function RoleCard({
  title,
  subtitle,
  icon,
  imageSrc,
  to,
  cta,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  imageSrc: string
  to: string
  cta: string
}) {
  return (
    <div className="p-7 md:p-10 border-t lg:border-t-0 lg:border-r last:lg:border-r-0">
      <div className="flex items-center gap-3 text-base font-semibold text-slate-900">
        <span className="h-12 w-12 rounded-2xl bg-brand-600 text-white grid place-items-center shadow-sm">{icon}</span>
        <div>
          <div className="text-lg font-bold">{title}</div>
          <div className="text-sm text-slate-600 font-medium">{subtitle}</div>
        </div>
      </div>

      <div className="mt-7 rounded-3xl overflow-hidden border bg-slate-100">
        <img src={imageSrc} alt="" className="h-56 md:h-64 w-full object-cover" />
      </div>

      <Button asChild className="mt-7 w-full h-12 text-base bg-brand-600 hover:bg-brand-700 text-white">
        <Link to={to}>
          {cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
