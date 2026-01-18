import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { PartnerShell, type PartnerTab } from '../../components/layout/PartnerShell'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { OrderFilters, type OrderFilterState } from '../../components/orders/OrderFilters'
import { PartnerMap } from '../../components/map/PartnerMap'
import { distanceKm } from '../../lib/geo'
import { PARTNER_HUB } from '../../mock/data'
import {
  assignOrderToAgent,
  createPartnerAgent,
  getPartnerAgents,
  getPartnerOrders,
  type PartnerAgent,
  type PartnerOrder,
} from '../../api/partner'
import type { Agent as MapAgent, Order as MapOrder } from '../../mock/types'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'

export default function PartnerDashboard() {
  const [tab, setTab] = useState<PartnerTab>('orders')
  const [filters, setFilters] = useState<OrderFilterState>({ query: '', status: 'all', maxDistanceKm: 5 })

  const [orders, setOrders] = useState<PartnerOrder[]>([])
  const [agents, setAgents] = useState<PartnerAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', password: '' })

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const [o, a] = await Promise.all([getPartnerOrders(), getPartnerAgents()])
      if (o.success) setOrders(o.orders)
      if (a.success) setAgents(a.agents)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load partner data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  const ordersWithDistance = useMemo(() => {
    return orders
      .map((o) => ({ o, d: distanceKm(PARTNER_HUB, { lat: o.latitude, lng: o.longitude }) }))
      .sort((a, b) => new Date(b.o.created_at ?? 0).getTime() - new Date(a.o.created_at ?? 0).getTime())
  }, [orders])

  const withinDefaultRadius = useMemo(
    () => ordersWithDistance.filter((x) => x.d <= 5).length,
    [ordersWithDistance],
  )

  const filteredOrders = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return ordersWithDistance
      .filter((x) => x.d <= filters.maxDistanceKm)
      .filter((x) => {
        if (!q) return true
        return (
          x.o.id.toLowerCase().includes(q) ||
          x.o.customer_name.toLowerCase().includes(q) ||
          x.o.phone_model.toLowerCase().includes(q)
        )
      })
        .filter((x) => (filters.status === 'all' ? true : x.o.status === filters.status))
  }, [ordersWithDistance, filters])

  const onlineAgents = useMemo(() => {
    const now = Date.now()
    return agents
      .map((a) => {
        const last = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0
        const isOnline = a.latitude != null && a.longitude != null && now - last < 10 * 60 * 1000
        return { ...a, isOnline }
      })
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline))
  }, [agents])

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length
    const inProgress = orders.filter((o) => o.status === 'in-progress').length
    const completed = orders.filter((o) => o.status === 'completed').length
    return { pending, inProgress, completed }
  }, [orders])

  const mapOrders = useMemo<MapOrder[]>(
    () =>
      filteredOrders.map(({ o }) => ({
        id: o.id,
        customerName: o.customer_name,
        phoneModel: o.phone_model,
        // Map backend status to UI status model used by the map/widgets
        status: o.status === 'completed' ? 'completed' : o.status === 'in-progress' ? 'on_the_way' : 'pending',
        createdAt: o.created_at ?? new Date().toISOString(),
        pickupLocation: { lat: o.latitude, lng: o.longitude },
        pickupAddress: o.full_address,
        assignedAgentId: o.agent_id ?? null,
        agentDecision: 'pending',
      })),
    [filteredOrders],
  )

  const statusLabel = (s: PartnerOrder['status']) => {
    if (s === 'in-progress') return 'In Progress'
    if (s === 'completed') return 'Completed'
    return 'Pending'
  }

  const statusBadgeClass = (s: PartnerOrder['status']) => {
    if (s === 'completed') return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
    if (s === 'in-progress') return 'bg-blue-500/15 text-blue-700 border-blue-500/30'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const mapAgents = useMemo<MapAgent[]>(
    () =>
      onlineAgents.map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone ?? '',
        liveStatus: a.isOnline ? 'pending' : 'offline',
        lastSeenAt: a.last_seen_at ?? new Date(0).toISOString(),
        location: { lat: a.latitude ?? PARTNER_HUB.lat, lng: a.longitude ?? PARTNER_HUB.lng },
      })),
    [onlineAgents],
  )

  return (
    <PartnerShell tab={tab} setTab={setTab}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Partner Dashboard</h1>
            <p className="text-sm text-slate-600">Orders and agents within your service radius.</p>
          </div>
          <div className="flex-1" />
          <div className="text-xs text-slate-500">Default view: within 5 km • Hub: {PARTNER_HUB.lat.toFixed(3)}, {PARTNER_HUB.lng.toFixed(3)}</div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs text-slate-600 min-h-[1rem]">
            {error ? <span className="text-rose-700">{error}</span> : null}
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading} size="sm">
            <RefreshCw className={['h-4 w-4', loading ? 'animate-spin' : ''].join(' ')} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        {tab === 'orders' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Pending</div>
                  <div className="text-2xl font-semibold">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">In Progress</div>
                  <div className="text-2xl font-semibold">{stats.inProgress}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Completed</div>
                  <div className="text-2xl font-semibold">{stats.completed}</div>
                </CardContent>
              </Card>
            </div>

            <OrderFilters
              value={filters}
              onChange={setFilters}
              withinCount={withinDefaultRadius}
              statusOptions={{
                pending: 'Pending',
                'in-progress': 'In Progress',
                completed: 'Completed',
              }}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-4">
              <PartnerMap hub={PARTNER_HUB} radiusKm={filters.maxDistanceKm} orders={mapOrders} agents={mapAgents} />

              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <Card>
                    <CardContent className="p-5 text-sm text-slate-600">No orders match the current filters.</CardContent>
                  </Card>
                ) : (
                  filteredOrders.map(({ o, d }) => (
                    <Card key={o.id} className="transition hover:-translate-y-0.5">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="flex items-center gap-2">
                              <span className="font-semibold truncate">{o.customer_name}</span>
                              <span
                                className={
                                  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ' +
                                  statusBadgeClass(o.status)
                                }
                              >
                                {statusLabel(o.status)}
                              </span>
                            </CardTitle>
                            <div className="mt-1 text-xs text-slate-500">
                              #{o.order_number ?? o.id} • {d.toFixed(1)} km
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold">₹{Number(o.price).toLocaleString()}</div>
                            <div className="text-xs text-slate-500">{new Date(o.pickup_date).toDateString()}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-slate-700 break-words">{o.full_address}</div>
                        <div className="mt-2 text-xs text-slate-600">
                          {o.phone_model} • {o.phone_variant} • {o.phone_condition}
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                          <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Users className="h-4 w-4" /> Assign agent
                          </div>
                          <div className="flex-1" />
                          <div className="w-full sm:w-72">
                            <select
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                              value={o.agent_id ?? ''}
                              disabled={o.status !== 'pending'}
                              onChange={async (e) => {
                                const agentId = e.target.value
                                if (!agentId) return
                                const resp = await assignOrderToAgent(o.id, agentId)
                                if (!resp.success) {
                                  alert(resp.message || 'Failed to assign order')
                                  return
                                }
                                await refresh()
                              }}
                            >
                              <option value="" disabled>
                                Select agent
                              </option>
                              {onlineAgents.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}{a.isOnline ? '' : ' (offline)'}
                                </option>
                              ))}
                            </select>
                            <div className="mt-1 text-xs text-slate-500">
                              {o.agent_name ? `Assigned: ${o.agent_name}` : 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}

        {tab === 'agents' ? (
          <>
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Agents</h2>
                <p className="text-sm text-slate-600">Live status is inferred from GPS updates (last 10 minutes = online).</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setCreateError(null); setCreateOpen(true) }}>
                Create agent
              </Button>
            </div>

            {onlineAgents.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-slate-600">No agents found.</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {onlineAgents.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{a.name}</div>
                          <div className="text-xs text-slate-600">{a.phone ?? '—'}</div>
                          <div className="mt-1 text-[11px] text-slate-500 break-all">Partner ID: {a.partner_id ?? '—'}</div>
                        </div>
                        <span
                          className={
                            a.isOnline
                              ? 'px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                              : 'px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-500/15 text-slate-700 border-slate-500/30'
                          }
                        >
                          {a.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-slate-600">
                        Last seen: {a.last_seen_at ? new Date(a.last_seen_at).toLocaleString() : '—'}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        GPS: {a.latitude != null && a.longitude != null ? `${a.latitude.toFixed(3)}, ${a.longitude.toFixed(3)}` : '—'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : null}

        <Modal
          open={createOpen}
          title="Create Agent"
          onClose={() => {
            if (!createLoading) setCreateOpen(false)
          }}
        >
          <div className="space-y-3">
            {createError ? <div className="text-sm text-rose-700">{createError}</div> : null}
            <div className="space-y-1">
              <div className="text-xs text-slate-600">Name</div>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Agent name"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-600">Phone (optional)</div>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Phone"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-600">Email (optional)</div>
              <Input
                value={createForm.email}
                onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="Email"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-600">Password</div>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="Set a password"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setCreateOpen(false)}
                disabled={createLoading}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setCreateError(null)
                  if (!createForm.name.trim() || !createForm.password) {
                    setCreateError('Name and password are required')
                    return
                  }
                  setCreateLoading(true)
                  try {
                    const resp = await createPartnerAgent({
                      name: createForm.name.trim(),
                      phone: createForm.phone.trim() || undefined,
                      email: createForm.email.trim() || undefined,
                      password: createForm.password,
                    })
                    if (!resp.success) {
                      setCreateError(resp.message || 'Failed to create agent')
                      return
                    }
                    setCreateForm({ name: '', phone: '', email: '', password: '' })
                    setCreateOpen(false)
                    await refresh()
                  } catch (e: any) {
                    setCreateError(e?.message ?? 'Failed to create agent')
                  } finally {
                    setCreateLoading(false)
                  }
                }}
                disabled={createLoading}
                size="sm"
              >
                {createLoading ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>

        {tab === 'stats' ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600">
                  This screen is ready for richer analytics once order lifecycle expands beyond{' '}
                  <span className="font-medium">pending → in-progress → completed</span>.
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </PartnerShell>
  )
}
