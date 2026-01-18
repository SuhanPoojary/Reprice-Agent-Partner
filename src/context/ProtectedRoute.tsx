import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from './AuthContext'

export default function ProtectedRoute({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const { user } = useAuth()

  if (!user) return <Navigate to={role === 'agent' ? '/agent/login' : '/partner/login'} replace />
  if (user.role !== role) return <Navigate to={user.role === 'partner' ? '/partner' : '/agent'} replace />

  return children
}
