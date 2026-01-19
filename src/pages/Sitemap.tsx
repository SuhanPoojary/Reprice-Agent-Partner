import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

export default function Sitemap() {
  const section = (title: string, links: Array<{ to: string; label: string }>) => (
    <div className="rounded-2xl border bg-white shadow-soft p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {links.map((l) => (
          <li key={l.to}>
            <Link className="hover:text-brand-700" to={l.to}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-grow bg-slate-50">
        <section className="bg-brand-600 text-white py-12">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Sitemap</h1>
            <p className="text-white/90">Quick links for the MobileTrade ops portal.</p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {section('Company', [
              { to: '/', label: 'Home' },
              { to: '/about-us', label: 'About Us' },
              { to: '/how-it-works', label: 'How It Works' },
              { to: '/contact', label: 'Contact' },
            ])}
            {section('Dashboards', [
              { to: '/partner', label: 'Partner Dashboard (login required)' },
              { to: '/agent', label: 'Agent Dashboard (login required)' },
            ])}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
