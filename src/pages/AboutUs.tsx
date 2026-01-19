import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-grow bg-slate-50">
        <section className="bg-brand-600 text-white py-12">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">About MobileTrade Ops</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              A partner + agent operations layer powering fast, reliable device pickups.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-700 leading-relaxed">
                <p>
                  MobileTrade started with a simple promise to customers: selling devices should be quick, transparent,
                  and safe. To make that promise real at scale, we built an operations platform that connects partners
                  and pickup agents to every order.
                </p>
                <p>
                  This portal helps teams assign pickups, track progress in real time, and keep the pickup lifecycle
                  consistent — from creation to completion.
                </p>
                <p>
                  Our goal is operational excellence: predictable SLAs, clear accountability, and a great pickup
                  experience for customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-slate-600">
                  Enable partners and agents with a modern workflow for assignments, navigation, and status updates —
                  so every pickup stays on-time and auditable.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-slate-600">
                  Build the most reliable pickup network for device trade in India, with real-time visibility and
                  customer-first execution.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold">Our Values</h2>
              <p className="text-slate-600">The principles that guide how we operate</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border shadow-soft">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-brand-700 font-bold">T</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Transparency</h3>
                <p className="text-slate-600">
                  Clear assignment rules, consistent status definitions, and visible performance.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-soft">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-emerald-700 font-bold">S</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Speed</h3>
                <p className="text-slate-600">Fast routing, quick decisions, and fewer manual handoffs.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-soft">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-indigo-700 font-bold">Q</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Quality</h3>
                <p className="text-slate-600">A consistent pickup experience, every time.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
