import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="MobileTrade" className="h-8 w-8 rounded-full" />
              <span className="text-xl font-bold text-brand-600">MobileTrade</span>
            </div>
            <p className="mt-4 text-sm text-slate-600 max-w-md">
              MobileTrade Ops is the partner + agent workflow layer for assignments, navigation, and real-time pickup
              status.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://facebook.com"
                className="text-slate-500 hover:text-brand-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                className="text-slate-500 hover:text-brand-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                className="text-slate-500 hover:text-brand-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                className="text-slate-500 hover:text-brand-700 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/about-us" className="hover:text-slate-900 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-slate-900 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-slate-900 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Dashboards</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/partner" className="hover:text-slate-900 transition-colors">
                  Partner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/agent" className="hover:text-slate-900 transition-colors">
                  Agent Dashboard
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="hover:text-slate-900 transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Help</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/contact" className="hover:text-slate-900 transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-slate-900 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <span className="text-slate-500" title="Placeholder">
                  Terms
                </span>
              </li>
              <li>
                <span className="text-slate-500" title="Placeholder">
                  Privacy
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} MobileTrade. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/sitemap" className="hover:text-slate-700">
              Sitemap
            </Link>
            <Link to="/contact" className="hover:text-slate-700">
              Help
            </Link>
            <Link to="/about-us" className="hover:text-slate-700">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
