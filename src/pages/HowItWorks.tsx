import { useMemo, useState } from 'react'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { Button } from '../components/ui/Button'

export default function HowItWorks() {
  const [view, setView] = useState<'partner' | 'agent'>('partner')

  const steps = useMemo(() => {
    if (view === 'partner') {
      return [
        {
          title: 'Set your hub & radius',
          desc: 'Configure hub location and service radius so nearby orders show up correctly on the map and list.',
          tipTitle: 'Tip',
          tipLines: ['Use live hub location for accuracy.', 'Use Back to hub to recenter when needed.'],
        },
        {
          title: 'Review and assign orders',
          desc: 'Compare orders on the map or list view, then assign each pickup to the best-suited agent.',
          tipTitle: 'Best practice',
          tipLines: ['Batch assignments by locality.', 'Monitor status changes to keep SLAs on track.'],
        },
        {
          title: 'Track performance',
          desc: 'Use the dashboard to monitor agents, order statuses, and completion rates in real time.',
          tipTitle: 'Quality checks',
          tipLines: ['Keep agent profiles updated.', 'Escalate stuck pickups quickly via Contact.'],
        },
      ]
    }

    return [
      {
        title: 'Receive assigned pickups',
        desc: 'When a partner assigns an order, it appears in your agent dashboard with pickup details.',
        tipTitle: 'Tip',
        tipLines: ['Check address details before starting.', 'Plan route if multiple pickups are assigned.'],
      },
      {
        title: 'Navigate and update status',
        desc: 'Use the workflow to move through statuses (On the way → Picked → Completed) to keep everyone updated.',
        tipTitle: 'Best practice',
        tipLines: ['Update status at each milestone.', 'Add notes if anything blocks pickup.'],
      },
      {
        title: 'Close the pickup',
        desc: 'After pickup/verification, mark the job completed so it’s reflected in partner tracking and stats.',
        tipTitle: 'Quality checks',
        tipLines: ['Confirm pickup success before closing.', 'Report exceptions immediately.'],
      },
    ]
  }, [view])

  const faqs = useMemo(() => {
    if (view === 'partner') {
      return [
        {
          q: 'Why is an order not showing in my list?',
          a: 'Check hub location, radius settings, and ensure location permissions are enabled for the most accurate filtering.',
        },
        {
          q: 'Can I reassign an order?',
          a: 'Yes. Reassign to another agent if availability changes or a pickup is at risk of missing SLA.',
        },
        {
          q: 'How do I avoid map jump on refresh?',
          a: 'The map preserves your view. Use Back to hub only when you want to recenter.',
        },
      ]
    }

    return [
      {
        q: 'Do I need GPS enabled?',
        a: 'GPS helps with accurate proximity and navigation. You can still work without it, but routing may be less accurate.',
      },
      {
        q: 'What if the customer is unavailable?',
        a: 'Add a note, update the status appropriately, and inform the partner team so they can reschedule or reassign.',
      },
      {
        q: 'How should I update status?',
        a: 'Update at each milestone so partners can track progress and customers get timely updates.',
      },
    ]
  }, [view])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-grow bg-slate-50">
        <section className="bg-brand-600 text-white py-12">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">How MobileTrade Ops Works</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">Choose a role to see the workflow.</p>

            <div className="mt-6 flex justify-center">
              <div className="inline-flex rounded-2xl bg-white/10 p-1 border border-white/15">
                <button
                  type="button"
                  onClick={() => setView('partner')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                    view === 'partner' ? 'bg-white text-brand-700 shadow-sm' : 'text-white/90 hover:text-white'
                  }`}
                >
                  Partner
                </button>
                <button
                  type="button"
                  onClick={() => setView('agent')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                    view === 'agent' ? 'bg-white text-brand-700 shadow-sm' : 'text-white/90 hover:text-white'
                  }`}
                >
                  Agent
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="secondary" className="bg-white/90 hover:bg-white">
                <a href="#steps">View steps</a>
              </Button>
              <Button asChild className="bg-white text-brand-700 hover:bg-slate-100">
                <a href="#faq">FAQ</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="steps" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-4xl mx-auto grid gap-10">
              {steps.map((s, idx) => (
                <Step
                  key={s.title}
                  number={idx + 1}
                  title={s.title}
                  desc={s.desc}
                  tipTitle={s.tipTitle}
                  tipLines={s.tipLines}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-12 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <p className="text-slate-600">Answers tailored for {view === 'partner' ? 'partners' : 'agents'}</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((f) => (
                <Faq key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function Step({
  number,
  title,
  desc,
  tipTitle,
  tipLines,
}: {
  number: number
  title: string
  desc: string
  tipTitle: string
  tipLines: string[]
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-soft p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-brand-600 text-white w-10 h-10 rounded-full grid place-items-center font-extrabold">
          {number}
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <p className="text-slate-600">{desc}</p>
      <div className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100">
        <h3 className="font-semibold mb-2">{tipTitle}:</h3>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
          {tipLines.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border">
      <h3 className="font-semibold">{q}</h3>
      <p className="text-slate-600 mt-2">{a}</p>
    </div>
  )
}
