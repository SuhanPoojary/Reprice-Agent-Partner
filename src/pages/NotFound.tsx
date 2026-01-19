import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="max-w-md w-full p-6">
        <div className="rounded-2xl border bg-white shadow-soft p-6">
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="mt-2 text-sm text-slate-600">The page you’re looking for doesn’t exist.</p>
          <div className="mt-5">
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
