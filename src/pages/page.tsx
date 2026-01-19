import { Link } from "react-router-dom"
import {
  MapPin,
  ShieldCheck,
  Truck,
  Users,
  Activity,
  Globe,
  Mail,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { SiteHeader } from "../components/SiteHeader"
import { SiteFooter } from "../components/SiteFooter"

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          {/* Ambient blobs */}
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-28 grid md:grid-cols-2 gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-5 py-2 text-sm font-semibold">
                <Truck className="w-4 h-4" />
                Logistics Management Platform
              </span>

              <h1 className="mt-6 text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
                Smart Pickup Operations
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Built for Scale
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                MobileTrade helps logistics partners assign agents, track pickups,
                and manage operations with clarity, speed, and real-time control.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03]"
                >
                  <Link to="/how-it-works">See how it works</Link>
                </Button>

                <Button asChild variant="secondary" className="rounded-full px-8 py-6">
                  <Link to="/contact">
                    <Mail className="h-4 w-4" /> Contact us
                  </Link>
                </Button>
              </div>

              <div className="mt-14 grid grid-cols-3 gap-5">
                <Stat title="5km" subtitle="Auto Radius" />
                <Stat title="Live" subtitle="Tracking" />
                <Stat title="24/7" subtitle="Operations" />
              </div>
            </div>

            {/* MOCK DASHBOARD */}
            <div className="relative">
              <img
                src="/images/landing2.jpg"
                alt="MobileTrade operations dashboard"
                className="w-full max-w-xl rounded-3xl shadow-2xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-extrabold text-center mb-16">
            Why Logistics Teams Choose MobileTrade
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <Feature
              icon={<Activity />}
              title="Live Agent Tracking"
              desc="Monitor agent movements and pickup progress in real time."
            />
            <Feature
              icon={<Globe />}
              title="Location Intelligence"
              desc="Orders auto filtered within partner radius."
            />
            <Feature
              icon={<ShieldCheck />}
              title="Status Control"
              desc="Pending → On the way → Picked → Completed."
            />
          </div>
        </section>

        {/* ROLE SECTION */}
        <section className="bg-slate-50 py-24">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
            <RoleCard
              title="Partner Portal"
              points={[
                "Assign orders to agents",
                "Track agent performance",
                "Monitor 5km radius orders",
                "Manage agent accounts",
              ]}
              link="/partner/login"
            />

            <RoleCard
              title="Agent Portal"
              points={[
                "Accept / Reject orders",
                "Navigation to pickup",
                "Update pickup status",
                "Mobile friendly UI",
              ]}
              link="/agent/login"
            />
          </div>
        </section>

        {/* Bottom effects */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50 to-indigo-50" />
          <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 right-1/4 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="rounded-3xl border bg-white/70 backdrop-blur-xl shadow-soft p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h4 className="text-2xl font-extrabold">Need help getting started?</h4>
                <p className="mt-2 text-slate-600 max-w-2xl">
                  Explore the workflow, or reach out to configure partner hubs, agent onboarding, and pickup SLAs.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="secondary">
                  <Link to="/about-us">About us</Link>
                </Button>
                <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white">
                  <Link to="/contact">Contact</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

/* COMPONENTS */

function Stat({ title, subtitle }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <p className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        {title}
      </p>
      <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="rounded-3xl border p-8 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h4 className="font-semibold text-xl">{title}</h4>
      <p className="text-slate-600 mt-2">{desc}</p>
    </div>
  )
}

function RoleCard({ title, points, link }: any) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm p-10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <h3 className="text-2xl font-extrabold mb-6">{title}</h3>
      <ul className="space-y-3 text-slate-600 mb-8">
        {points.map((p: string) => (
          <li key={p}>✔ {p}</li>
        ))}
      </ul>
      <Button
        asChild
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-5"
      >
        <Link to={link}>Open {title}</Link>
      </Button>
    </div>
  )
}
