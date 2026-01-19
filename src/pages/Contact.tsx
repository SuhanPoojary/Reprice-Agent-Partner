import { useState } from 'react'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { Button } from '../components/ui/Button'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    }, 900)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-grow bg-slate-50">
        <section className="bg-brand-600 text-white py-12">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Contact Us</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              Reach out for partner onboarding, SLA setup, and operational support.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white p-6 md:p-8 rounded-2xl border shadow-soft">
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full grid place-items-center mx-auto mb-4">
                      <span className="text-emerald-700 font-bold">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
                    <p className="text-slate-600 mb-6">
                      Your message has been submitted. We’ll get back shortly.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)}>Send Another Message</Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-slate-700">Full Name</div>
                          <input
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-slate-700">Email Address</div>
                          <input
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-700">Phone Number</div>
                        <input
                          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-700">Your Message</div>
                        <textarea
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                          rows={5}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Sending…' : 'Send Message'}
                      </Button>
                    </form>
                  </>
                )}
              </div>

              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                  <p className="text-slate-600">
                    For operational issues, order escalations, and partner onboarding, contact our support team.
                  </p>
                </div>

                <div className="space-y-6">
                  <InfoRow icon={<Phone className="h-6 w-6 text-brand-700" />} title="Phone">
                    <div className="text-slate-600">Support: 1800-123-4567</div>
                    <div className="text-slate-600">Business: +91 98765 43210</div>
                  </InfoRow>

                  <InfoRow icon={<Mail className="h-6 w-6 text-brand-700" />} title="Email">
                    <div className="text-slate-600">support@mobiletrade.com</div>
                    <div className="text-slate-600">partners@mobiletrade.com</div>
                  </InfoRow>

                  <InfoRow icon={<MapPin className="h-6 w-6 text-brand-700" />} title="Office">
                    <div className="text-slate-600">
                      123 Business Park, Tech Avenue
                      <br />
                      Mumbai, Maharashtra 400001
                    </div>
                  </InfoRow>

                  <InfoRow icon={<Clock className="h-6 w-6 text-brand-700" />} title="Hours">
                    <div className="text-slate-600">Mon–Fri: 9:00 AM – 8:00 PM</div>
                    <div className="text-slate-600">Sat: 10:00 AM – 6:00 PM</div>
                    <div className="text-slate-600">Sun: Closed</div>
                  </InfoRow>
                </div>

                <div className="mt-8 p-4 bg-brand-50 rounded-2xl border border-brand-100">
                  <h3 className="font-semibold mb-2">Need immediate assistance?</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    If an active pickup is blocked, call support to escalate.
                  </p>
                  <Button variant="secondary" className="w-full">
                    <Phone className="mr-2 h-4 w-4" /> Call Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 bg-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="bg-slate-100 h-80 rounded-2xl overflow-hidden border grid place-items-center">
              <p className="text-slate-500">Map placeholder</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-brand-50 p-3 rounded-full border border-brand-100">{icon}</div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="mt-1 space-y-1">{children}</div>
      </div>
    </div>
  )
}
