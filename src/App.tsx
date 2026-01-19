import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/page'
import NotFound from './pages/NotFound'
import AboutUs from './pages/AboutUs'
import HowItWorks from './pages/HowItWorks'
import Contact from './pages/Contact'
import Sitemap from './pages/Sitemap'
import LoginTo from './pages/loginto'
import PartnerDashboard from './pages/partner/PartnerDashboard'
import AgentDashboard from './pages/agent/AgentDashboard'
import ProtectedRoute from './context/ProtectedRoute'
import { MockDataProvider } from './mock/MockDataContext'
import AgentLogin from './pages/agent/AgentLogin'
import PartnerLogin from './pages/partner/PartnerLogin'
import { OrderFlowProvider } from './context/OrderFlowContext'

export default function App() {
  return (
    <AuthProvider>
      <MockDataProvider>
        <OrderFlowProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/loginto" element={<LoginTo />} />
            <Route path="/login" element={<Navigate to="/loginto" replace />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/agent/login" element={<AgentLogin />} />
            <Route path="/partner/login" element={<PartnerLogin />} />

            <Route
              path="/partner"
              element={
                <ProtectedRoute role="partner">
                  <PartnerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agent"
              element={
                <ProtectedRoute role="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </OrderFlowProvider>
      </MockDataProvider>
    </AuthProvider>
  )
}
