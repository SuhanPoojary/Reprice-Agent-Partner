import { useCallback, useEffect, useMemo, useState } from 'react'
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
// import { Card, CardContent } from '../../components/ui/Card' // unused
import { useAuth } from '../../context/AuthContext'
import { useGeoLocation } from '../../hooks/useGeoLocation'
import { distanceKm, formatKm } from '../../lib/geo'
import { apiFetch, type ApiError } from '../../api/client'
import {
  cancelPickup,
  completePickup,
  declinePickup,
  getMyPickups,
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

type StickyOrdersV1 = {
  version: 1
  savedAt: string
  ordersById: Record<string, BackendOrder>
}

function stickyKeyForAgent(agentId: string) {
  return `apdash.agent.stickyAccepted.v1.${agentId}`
}

function loadSticky(agentId: string): StickyOrdersV1 | null {
  try {
    const raw = localStorage.getItem(stickyKeyForAgent(agentId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StickyOrdersV1
    if (!parsed || parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

function saveSticky(agentId: string, sticky: StickyOrdersV1) {
  try {
    localStorage.setItem(stickyKeyForAgent(agentId), JSON.stringify(sticky))
  } catch {
    // ignore
  }
}

function mergeOrders(preferred: BackendOrder[], fallback: BackendOrder[]) {
  const map = new Map<string, BackendOrder>()
  for (const o of fallback) map.set(String(o.id), o)
  for (const o of preferred) map.set(String(o.id), o) // preferred wins
  return Array.from(map.values())
}

function directionsUrl(order: BackendOrder) {
  return `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
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
  const { user, token, logout } = useAuth()
  const geo = useGeoLocation(true)

  const [view, setView] = useState<View>('nearby')
  const [nearbyOrders, setNearbyOrders] = useState<BackendOrder[]>([])
  const [inProgressOrders, setInProgressOrders] = useState<BackendOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<BackendOrder[]>([])
  const [previewOrder, setPreviewOrder] = useState<BackendOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyOrderIds, setBusyOrderIds] = useState<Set<string>>(new Set())

  // ✅ sticky store so accepted orders never disappear due to stale fetch/caches
  const [stickyById, setStickyById] = useState<Record<string, BackendOrder>>({})

  const isBusy = (id: string | number) => busyOrderIds.has(String(id))

  const upsertSticky = (o: BackendOrder) => {
    const key = String(o.id)
    setStickyById((prev) => ({ ...prev, [key]: o }))
  }

  const fetchAllOrders = useCallback(async (): Promise<BackendOrder[] | null> => {
    setLoading(true)
    setError(null)
    try {
      const myResp = await getMyPickups()
      if (myResp.success) {
        setNearbyOrders(myResp.orders.filter((o) => o.status === 'pending'))
        setInProgressOrders(myResp.orders.filter((o) => o.status === 'in-progress'))
        setCompletedOrders(myResp.orders.filter((o) => o.status === 'completed'))
        return myResp.orders
      }
      return null
    } catch (e: any) {
      const err = e as ApiError
      setError(err?.message ?? 'Failed to fetch orders')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const withOrderAction = useCallback(
    async (orderId: string | number, fn: () => Promise<void>) => {
      const key = String(orderId)
      if (busyOrderIds.has(key)) return

      setBusyOrderIds((prev) => new Set(prev).add(key))
      try {
        await fn()
      } catch (e: any) {
        const status = typeof e?.status === 'number' ? e.status : undefined
        const msg = e?.message ?? 'Something went wrong'
        alert(status === 409 ? msg || 'Order already assigned or not available' : msg)
        await fetchAllOrders().catch(() => {})
      } finally {
        setBusyOrderIds((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [busyOrderIds, fetchAllOrders],
  )

  // Route-guard
  useEffect(() => {
    if (!token) {
      navigate('/agent/login')
      return
    }
    if (!user) return
    if (user.role !== 'agent') navigate('/agent/login')
  }, [token, user, navigate])

  // ✅ Load sticky + cached orders; background refresh if stale
  useEffect(() => {
    if (!token) return
    if (!user) return
    if (user.role !== 'agent') return

    const sticky = loadSticky(user.id)
    if (sticky?.ordersById) setStickyById(sticky.ordersById)

    const cached = loadOrdersCache(user.id)
    if (cached) {
      setNearbyOrders(cached.nearby ?? [])
      setInProgressOrders(cached.inProgress ?? [])
      setCompletedOrders(cached.completed ?? [])

      const savedAtMs = Date.parse(cached.savedAt || '')
      const isStale = !Number.isFinite(savedAtMs) || Date.now() - savedAtMs > 15_000
      if (isStale) void fetchAllOrders()
      return
    }

    void fetchAllOrders()
  }, [token, user, fetchAllOrders])

  // Update agent location (best effort)
  useEffect(() => {
    if (!token) return
    if (geo.status !== 'ok') return
    if (!geo.position) return
    updateAgentLocation(geo.position.lat, geo.position.lng).catch(() => {})
  }, [token, geo.status, geo.position?.lat, geo.position?.lng])

  // Persist orders cache
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

  // ✅ Persist sticky “accepted” orders
  useEffect(() => {
    if (!user || user.role !== 'agent') return
    if (!token) return
    saveSticky(user.id, {
      version: 1,
      savedAt: new Date().toISOString(),
      ordersById: stickyById,
    })
  }, [token, user, stickyById])

  // ✅ Merge sticky into UI lists so accepted orders never disappear
  const stickyPending = useMemo(
    () => Object.values(stickyById).filter((o) => o.status === 'pending'),
    [stickyById],
  )
  const stickyInProgress = useMemo(
    () => Object.values(stickyById).filter((o) => o.status === 'in-progress'),
    [stickyById],
  )
  const stickyCompleted = useMemo(
    () => Object.values(stickyById).filter((o) => o.status === 'completed'),
    [stickyById],
  )

  const mergedNearby = useMemo(() => mergeOrders(nearbyOrders, stickyPending), [nearbyOrders, stickyPending])
  const mergedInProgress = useMemo(
    () => mergeOrders(inProgressOrders, stickyInProgress),
    [inProgressOrders, stickyInProgress],
  )
  const mergedCompleted = useMemo(
    () => mergeOrders(completedOrders, stickyCompleted),
    [completedOrders, stickyCompleted],
  )

  const displayedOrders = useMemo(() => {
    const base = view === 'nearby' ? mergedNearby : view === 'my' ? mergedInProgress : mergedCompleted
    const myPos = geo.status === 'ok' ? geo.position : null
    return base.map((o) => {
      const computed =
        myPos && (o.distance_km == null || Number.isNaN(o.distance_km))
          ? distanceKm(myPos, { lat: o.latitude, lng: o.longitude })
          : o.distance_km
      return { ...o, distance_km: computed }
    })
  }, [view, mergedNearby, mergedInProgress, mergedCompleted, geo.status, geo.position])

  const stats = useMemo(() => {
    const incoming = mergedNearby.filter((o) => o.status === 'pending').length
    const started = mergedInProgress.filter((o) => o.status === 'in-progress').length
    const completed = mergedCompleted.filter((o) => o.status === 'completed').length
    const earnings = mergedCompleted
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.price) * 0.05, 0)
    return { incoming, started, completed, earnings }
  }, [mergedNearby, mergedInProgress, mergedCompleted])

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
            <Button type="button" variant="secondary" size="sm" onClick={() => void fetchAllOrders()} disabled={loading}>
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
              Assigned Orders
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
              { label: 'Assigned Orders', value: stats.incoming, icon: Package },
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={isBusy(order.id)}
                              onClick={() =>
                                void withOrderAction(order.id, async () => {
                                  // ✅ Try proper "start" first; fallback to existing startPickup (which may call /assign)
                                  try {
                                    await apiFetch(`/orders/${order.id}/start`, { method: 'PATCH' })
                                  } catch (e: any) {
                                    // If /start not supported, fallback.
                                    if (e?.status === 404 || e?.status === 405) {
                                      const resp = await startPickup(order.id)
                                      if (!resp?.success) {
                                        alert(resp?.message || 'Failed to start pickup')
                                        await fetchAllOrders().catch(() => {})
                                        return
                                      }
                                    } else if (e?.status === 409) {
                                      // Conflict: re-sync and decide if it became "mine" or was taken.
                                      const orders = await fetchAllOrders().catch(() => null)
                                      const mine = orders?.find((o) => String(o.id) === String(order.id))
                                      if (mine) {
                                        upsertSticky(mine.status === 'in-progress' ? mine : { ...mine, status: 'in-progress' })
                                        setNearbyOrders((prev) => prev.filter((o) => o.id !== order.id))
                                        setInProgressOrders((prev) => mergeOrders([{ ...order, status: 'in-progress' }], prev))
                                        if (previewOrder?.id === order.id) setPreviewOrder(null)
                                        return
                                      }
                                      setNearbyOrders((prev) => prev.filter((o) => o.id !== order.id))
                                      alert('Order already taken by another agent.')
                                      if (previewOrder?.id === order.id) setPreviewOrder(null)
                                      return
                                    } else {
                                      throw e
                                    }
                                  }

                                  // Optimistic UI + sticky (accepted orders never disappear)
                                  upsertSticky({ ...order, status: 'in-progress' })
                                  setNearbyOrders((prev) => prev.filter((o) => o.id !== order.id))
                                  setInProgressOrders((prev) => [{ ...order, status: 'in-progress' }, ...prev])
                                  if (previewOrder?.id === order.id) setPreviewOrder(null)

                                  // Final sync
                                  await fetchAllOrders().catch(() => {})
                                })
                              }
                            >
                              Start Pickup
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isBusy(order.id)}
                              onClick={() =>
                                void withOrderAction(order.id, async () => {
                                  // ✅ Decline should not be /cancel for pending. Try /decline; fall back safely.
                                  try {
                                    await apiFetch(`/orders/${order.id}/decline`, { method: 'PATCH' })
                                  } catch (e: any) {
                                    if (e?.status === 404 || e?.status === 405) {
                                      try {
                                        const resp = await declinePickup(order.id)
                                        if (!resp?.success) throw Object.assign(new Error(resp?.message || 'Failed to decline'), { status: 400 })
                                      } catch {
                                        // last-resort fallback (some backends misuse /cancel for decline)
                                        const resp2 = await cancelPickup(order.id)
                                        if (!resp2?.success) {
                                          alert(resp2?.message || 'Failed to decline order')
                                          await fetchAllOrders().catch(() => {})
                                          return
                                        }
                                      }
                                    } else if (e?.status === 400 || e?.status === 409) {
                                      await fetchAllOrders().catch(() => {})
                                      alert(e?.message || 'Order cannot be declined right now.')
                                      return
                                    } else {
                                      throw e
                                    }
                                  }

                                  setNearbyOrders((prev) => prev.filter((o) => o.id !== order.id))
                                  if (previewOrder?.id === order.id) setPreviewOrder(null)
                                  // keep sticky as-is (declined order wasn’t accepted)
                                  await fetchAllOrders().catch(() => {})
                                })
                              }
                            >
                              Decline
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {order.status === 'in-progress' ? (
                        <div className="flex gap-2 mt-2 md:justify-end">
                          <Button
                            size="sm"
                            disabled={isBusy(order.id)}
                            onClick={() =>
                              void withOrderAction(order.id, async () => {
                                const resp = await completePickup(order.id)
                                if (resp?.success) {
                                  const completedSnap = { ...order, status: 'completed' as const }
                                  upsertSticky(completedSnap) // ✅ keep forever (never disappear)
                                  setInProgressOrders((prev) => prev.filter((o) => o.id !== order.id))
                                  setCompletedOrders((prev) => [completedSnap, ...prev])
                                  if (previewOrder?.id === order.id) setPreviewOrder(null)
                                  await fetchAllOrders().catch(() => {})
                                } else {
                                  alert(resp?.message || 'Failed to complete order')
                                  await fetchAllOrders().catch(() => {})
                                }
                              })
                            }
                          >
                            Complete
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isBusy(order.id)}
                            onClick={() =>
                              void withOrderAction(order.id, async () => {
                                const resp = await cancelPickup(order.id)
                                if (resp?.success) {
                                  // back to pending; keep sticky snapshot so it never disappears
                                  const pendingSnap = { ...order, status: 'pending' as const }
                                  upsertSticky(pendingSnap)
                                  setInProgressOrders((prev) => prev.filter((o) => o.id !== order.id))
                                  setNearbyOrders((prev) => [pendingSnap, ...prev])
                                  if (previewOrder?.id === order.id) setPreviewOrder(null)
                                  await fetchAllOrders().catch(() => {})
                                } else {
                                  alert(resp?.message || 'Failed to cancel order')
                                  await fetchAllOrders().catch(() => {})
                                }
                              })
                            }
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
                onClick={() => {
                  if (!previewOrder) return
                  window.open(directionsUrl(previewOrder), '_blank')
                }}
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
