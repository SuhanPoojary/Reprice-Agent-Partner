import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  IndianRupee,
  MapPin,
  Navigation,
  Package,
  Smartphone,
  Users,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { useGeoLocation } from '../../hooks/useGeoLocation'
import { distanceKm, formatKm } from '../../lib/geo'
import type { ApiError } from '../../api/client'
import {
  cancelPickup,
  completePickup,
  getMyPickups,
  getNearbyOrders,
  startPickup,
  updateAgentLocation,
  type BackendOrder,
} from '../../api/agent'

type View = 'nearby' | 'my' | 'history'

type OrdersCacheV1 = {
  version: 1
  savedAt: string
  nearby: BackendOrder[]
  inProgress: BackendOrder[]
  completed: BackendOrder[]
}

function directionsUrl(order: BackendOrder) {
  return `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
}

function shortId(id: string) {
  if (!id) return ''
  return id.length > 10 ? `${id.slice(0, 8)}…${id.slice(-3)}` : id
}

function formatMoneyINR(value: number) {
  const n = Number(value)
  if (Number.isNaN(n)) return '₹0'
  return `₹${n.toLocaleString()}`
}

function cacheKeyForAgent(agentId: string) {
  return `apdash.agent.orders.v1.${agentId}`
}

function loadOrdersCache(agentId: string): OrdersCacheV1 | null {
  try {
    const raw = localStorage.getItem(cacheKeyForAgent(agentId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as OrdersCacheV1
    if (!parsed || parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

function saveOrdersCache(agentId: string, cache: OrdersCacheV1) {
  try {
    localStorage.setItem(cacheKeyForAgent(agentId), JSON.stringify(cache))
  } catch {
    // Ignore quota / private mode
  }
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const { user, token, refreshMe, logout } = useAuth()
  const geo = useGeoLocation(true)

  const [view, setView] = useState<View>('nearby')
  const [nearbyOrders, setNearbyOrders] = useState<BackendOrder[]>([])
  const [inProgressOrders, setInProgressOrders] = useState<BackendOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<BackendOrder[]>([])
  const [previewOrder, setPreviewOrder] = useState<BackendOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ensure /auth/me has populated agent user when token exists.
  useEffect(() => {
    if (!token) return
    if (user?.role === 'agent') return
    refreshMe().catch(() => {})
  }, [token, user?.role])

  // Route-guard (matches the sample behavior)
  useEffect(() => {
    if (!token) {
      navigate('/agent/login')
      return
    }

    // If token exists but user is not hydrated yet, wait.
    if (!user) return

    if (user.role !== 'agent') {
      navigate('/agent/login')
    }
  }, [token, user, navigate])

  // Load cached orders once (no auto-refresh on every tab switch)
  useEffect(() => {
    if (!token) return
    if (!user) return
    if (user.role !== 'agent') return

    const cached = loadOrdersCache(user.id)
    if (cached) {
      setNearbyOrders(cached.nearby ?? [])
      setInProgressOrders(cached.inProgress ?? [])
      setCompletedOrders(cached.completed ?? [])
      return
    }

    // No cache yet: do a one-time fetch.
    void (async () => {
      await fetchAllOrders()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, user?.role])

  // Update agent location (best effort)
  useEffect(() => {
    if (!token) return
    if (geo.status !== 'ok') return
    updateAgentLocation(geo.position.lat, geo.position.lng).catch(() => {})
  }, [token, geo.status])

  const fetchAllOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const [nearbyResp, myResp] = await Promise.all([getNearbyOrders(), getMyPickups()])

      if (nearbyResp.success) {
        setNearbyOrders(nearbyResp.orders.filter((o) => o.status === 'pending'))
      }

      if (myResp.success) {
        setInProgressOrders(myResp.orders.filter((o) => o.status === 'in-progress'))
        setCompletedOrders(myResp.orders.filter((o) => o.status === 'completed'))
      }
    } catch (e: any) {
      const err = e as ApiError
      setError(err?.message ?? 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  // Persist orders to localStorage (so it doesn't load every time)
  useEffect(() => {
    if (!user || user.role !== 'agent') return
    if (!token) return

    saveOrdersCache(user.id, {
      version: 1,
      savedAt: new Date().toISOString(),
      nearby: nearbyOrders,
      inProgress: inProgressOrders,
      completed: completedOrders,
    })
  }, [token, user, nearbyOrders, inProgressOrders, completedOrders])

  const displayedOrders = useMemo(() => {
    const base = view === 'nearby' ? nearbyOrders : view === 'my' ? inProgressOrders : completedOrders
    const myPos = geo.status === 'ok' ? geo.position : null
    return base.map((o) => {
      const computed =
        myPos && (o.distance_km == null || Number.isNaN(o.distance_km))
          ? distanceKm(myPos, { lat: o.latitude, lng: o.longitude })
          : o.distance_km
      return { ...o, distance_km: computed }
    })
  }, [view, nearbyOrders, inProgressOrders, completedOrders, geo.status, geo.position])

  const stats = useMemo(() => {
    const incoming = nearbyOrders.filter((o) => o.status === 'pending').length
    const started = inProgressOrders.filter((o) => o.status === 'in-progress').length
    const completed = completedOrders.filter((o) => o.status === 'completed').length
    const earnings = completedOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.price) * 0.05, 0)

    return { incoming, started, completed, earnings }
  }, [nearbyOrders, inProgressOrders, completedOrders])

  const orderStatusBadge = (status: BackendOrder['status']) => {
    const map: Record<BackendOrder['status'], { label: string; cls: string }> = {
      pending: { label: 'Pending', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
      'in-progress': { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    }
    const s = map[status]
    return (
      <span className={['inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', s.cls].join(' ')}>
        {s.label}
      </span>
    )
  }

  const renderEmpty = (text: string) => (
    <div className="bg-white p-12 rounded-2xl text-center shadow">
      <Package className="mx-auto h-10 w-10 text-slate-400 mb-4" />
      <h3 className="text-xl font-semibold text-slate-900">{text}</h3>
      <p className="text-slate-500 mt-1">Orders will appear here.</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Agent Dashboard</div>
            <div className="text-xs text-slate-600">Live pickups</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fetchAllOrders()}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, <span className="text-blue-600">{user?.name ?? 'Agent'}</span>
            </h1>
            <p className="text-slate-500 mt-1">Here's what's happening with your pickups.</p>
            {error ? <div className="mt-2 text-sm text-rose-700">{error}</div> : null}
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <Button
              variant={view === 'nearby' ? 'primary' : 'secondary'}
              onClick={() => setView('nearby')}
            >
              Nearby Orders
            </Button>
            <Button
              variant={view === 'my' ? 'primary' : 'secondary'}
              onClick={() => setView('my')}
            >
              My Pickups
            </Button>
            <Button
              variant={view === 'history' ? 'primary' : 'secondary'}
              onClick={() => setView('history')}
            >
              History
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Incoming Orders', value: stats.incoming, icon: Package },
              { label: 'Pending', value: stats.started, icon: Clock },
              { label: 'Completed', value: stats.completed, icon: CheckCircle },
              { label: 'Earnings', value: formatMoneyINR(stats.earnings), icon: IndianRupee },
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow">
                <s.icon className="h-6 w-6 text-slate-800" />
                <p className="text-sm text-slate-500 mt-2">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Orders */}
          {loading && displayedOrders.length === 0 ? (
            renderEmpty('Loading orders')
          ) : displayedOrders.length === 0 ? (
            renderEmpty('No orders')
          ) : (
            <div className="space-y-4">
              {displayedOrders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-2xl shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-slate-500" />
                        <h3 className="font-semibold text-slate-900 truncate">{order.phone_model}</h3>
                        {orderStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {order.phone_variant} • {order.phone_condition}
                      </p>

                      <div className="text-sm mt-3 text-slate-700 space-y-1">
                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 mt-0.5 text-slate-500" />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900">{order.customer_name}</div>
                            <div className="text-sm text-slate-600 flex items-start gap-2 mt-1">
                              <MapPin className="h-4 w-4 mt-0.5 text-slate-500" />
                              <span className="break-words">{order.full_address}</span>
                              {order.distance_km ? (
                                <span className="ml-2 text-blue-600 whitespace-nowrap">
                                  • {formatKm(order.distance_km)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>
                            {order.pickup_date ? new Date(order.pickup_date).toDateString() : '—'}
                            {order.time_slot ? ` • ${order.time_slot}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right shrink-0">
                      <p className="font-bold text-slate-900">₹{Number(order.price).toLocaleString()}</p>

                      <div className="flex md:justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPreviewOrder(order)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {view === 'nearby' && order.status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={async () => {
                              const resp = await startPickup(order.id)
                              if (resp?.success) {
                                // Move from incoming -> started
                                setNearbyOrders((prev) => prev.filter((o) => o.id !== order.id))
                                setInProgressOrders((prev) => [{ ...order, status: 'in-progress' }, ...prev])
                                if (previewOrder?.id === order.id) setPreviewOrder(null)
                              } else {
                                alert(resp?.message || 'Order already taken')
                              }
                            }}
                          >
                            Start Pickup
                          </Button>
                        ) : null}
                      </div>

                      {order.status === 'in-progress' ? (
                        <div className="flex gap-2 mt-2 md:justify-end">
                          <Button
                            size="sm"
                            onClick={async () => {
                              const resp = await completePickup(order.id)
                              if (resp?.success) {
                                setInProgressOrders((prev) => prev.filter((o) => o.id !== order.id))
                                setCompletedOrders((prev) => [{ ...order, status: 'completed' }, ...prev])
                                if (previewOrder?.id === order.id) setPreviewOrder(null)
                              } else {
                                alert(resp?.message || 'Failed to complete order')
                              }
                            }}
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              const resp = await cancelPickup(order.id)
                              if (resp?.success) {
                                // Move from started -> incoming
                                setInProgressOrders((prev) => prev.filter((o) => o.id !== order.id))
                                setNearbyOrders((prev) => [{ ...order, status: 'pending' }, ...prev])
                                if (previewOrder?.id === order.id) setPreviewOrder(null)
                              } else {
                                alert(resp?.message || 'Failed to cancel order')
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PREVIEW MODAL */}
        {previewOrder ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 relative">
              <button
                onClick={() => setPreviewOrder(null)}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-900"
                type="button"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold mb-4 text-slate-900">Order Preview</h2>

              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  <b>Customer:</b> {previewOrder.customer_name}
                </p>
                <p>
                  <b>Address:</b> {previewOrder.full_address}
                </p>
                <p>
                  <b>Phone:</b> {previewOrder.phone_model} ({previewOrder.phone_variant}, {previewOrder.phone_condition})
                </p>
                <p>
                  <b>Pickup Date:</b> {previewOrder.pickup_date ? new Date(previewOrder.pickup_date).toDateString() : '—'}
                </p>
                <p>
                  <b>Time Slot:</b> {previewOrder.time_slot ? previewOrder.time_slot : '—'}
                </p>
                <p>
                  <b>Price:</b> ₹{Number(previewOrder.price).toLocaleString()}
                </p>
                <p>
                  <b>Status:</b> {previewOrder.status}
                </p>
              </div>

              <Button
                className="mt-4 w-full"
                onClick={() => window.open(directionsUrl(previewOrder), '_blank')}
              >
                <Navigation className="h-4 w-4" /> Navigate to Customer
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t bg-white/70 backdrop-blur">
        <div className="container mx-auto px-4 py-4 text-sm text-slate-600 flex items-center justify-between">
          <div>Reprice • Agent</div>
          <div className="text-xs text-slate-500">{geo.status === 'ok' ? 'GPS active' : 'GPS off'}</div>
        </div>
      </footer>
    </div>
  )
}
