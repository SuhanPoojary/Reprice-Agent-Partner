import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/page'
import NotFound from './pages/NotFound'
import PartnerDashboard from './pages/partner/PartnerDashboard'
import AgentDashboard from './pages/agent/AgentDashboard'
import ProtectedRoute from './context/ProtectedRoute'
import { MockDataProvider } from './mock/MockDataContext'
import AgentLogin from './pages/agent/AgentLogin'
import PartnerLogin from './pages/partner/PartnerLogin'

export default function App() {
  return (
    <AuthProvider>
      <MockDataProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/partner/login" element={<PartnerLogin />} />

          {/* Back-compat links */}
          <Route path="/portal" element={<Navigate to="/login" replace />} />

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
      </MockDataProvider>
    </AuthProvider>
  )
}
