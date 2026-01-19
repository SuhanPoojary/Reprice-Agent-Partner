import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import RoleAuth from '../auth/RoleAuth'
import Home from '../page'
import { Button } from '../../components/ui/Button'

export default function AgentLogin() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen">
      <Home />

      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <Button
              type="button"
              variant="secondary"
              className="absolute -top-12 right-0 bg-white/90 hover:bg-white"
              onClick={() => navigate('/loginto')}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
            <RoleAuth role="agent" variant="modal" />
          </div>
        </div>
      </div>
    </div>
  )
}
