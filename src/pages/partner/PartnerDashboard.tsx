import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Users, Package, MapPin, Calendar, Smartphone, Map as MapIcon, List as ListIcon } from 'lucide-react'
import { PartnerShell, type PartnerTab } from '../../components/layout/PartnerShell'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { OrderFilters, type OrderFilterState } from '../../components/orders/OrderFilters'
import { PartnerMap, type PartnerMapHandle } from '../../components/map/PartnerMap'
import {
  assignOrderToAgent,
  createPartnerAgent,
  getPartnerAgents,
  getPartnerOrders,
  getAvailableOrders,
  acceptOrder,
  unacceptOrder,
  getMyCreditBalance,
  listMyCreditPlans,
  buyCreditPlan,
  updatePartnerHubLocation,
  type PartnerCreditPlan,
  type PartnerAgent,
  type PartnerOrder,
} from '../../api/partner'
import type { ApiError } from '../../api/client'
import type { Agent as MapAgent, Order as MapOrder } from '../../mock/types'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { usePartnerHubLocation } from '../../hooks/usePartnerHubLocation'
import { useAuth } from '../../context/AuthContext'

type AcceptedOrdersStoreV1 = {
  version: 1
  acceptedAtById: Record<string, string>
}

const ACCEPTED_STORE_KEY = 'reprice.partner.acceptedOrders.v1'

function loadAcceptedStore(): AcceptedOrdersStoreV1 {
  try {
    const raw = localStorage.getItem(ACCEPTED_STORE_KEY)
    if (!raw) return { version: 1, acceptedAtById: {} }
    const parsed = JSON.parse(raw) as Partial<AcceptedOrdersStoreV1>
    if (parsed?.version !== 1 || !parsed.acceptedAtById) return { version: 1, acceptedAtById: {} }
    return { version: 1, acceptedAtById: parsed.acceptedAtById }
  } catch {
    return { version: 1, acceptedAtById: {} }
  }
}

function saveAcceptedStore(store: AcceptedOrdersStoreV1) {
  try {
    localStorage.setItem(ACCEPTED_STORE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

export default function PartnerDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<PartnerTab>('orders')
  const [ordersPanel, setOrdersPanel] = useState<'orders' | 'agents'>('orders')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [filters, setFilters] = useState<OrderFilterState>({ query: '', status: 'all' })
  const [takeOrdersFilter, setTakeOrdersFilter] = useState<'accepted' | 'unaccepted'>('unaccepted')
  const [acceptedOrderIds, setAcceptedOrderIds] = useState<Set<string>>(new Set())
  const [acceptedAtById, setAcceptedAtById] = useState<Record<string, string>>({})

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [agentOrderPreview, setAgentOrderPreview] = useState<PartnerOrder | null>(null)

  const [orders, setOrders] = useState<PartnerOrder[]>([])
  const [availableOrders, setAvailableOrders] = useState<PartnerOrder[]>([])
  const [agents, setAgents] = useState<PartnerAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null)
  const [acceptPromptOrder, setAcceptPromptOrder] = useState<PartnerOrder | null>(null)
  const [acceptPromptStep, setAcceptPromptStep] = useState<'details' | 'payment'>('details')
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null)

  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [creditPlans, setCreditPlans] = useState<PartnerCreditPlan[]>([])
  const [creditsModalOpen, setCreditsModalOpen] = useState(false)
  const [buyingPlanId, setBuyingPlanId] = useState<number | null>(null)

  const [createOpen, setCreateOpen] = useState(false)

  const partnerVerificationStatus = (user?.verification_status || '').toLowerCase()
  const partnerIsActive = user?.is_active

  useEffect(() => {
    if (!user || user.role !== 'partner') return
    const isClarification =
      partnerVerificationStatus === 'clarification' || partnerVerificationStatus === 'clarification_needed'

    if (partnerVerificationStatus && partnerVerificationStatus !== 'approved') {
      // Avoid spamming APIs when partner is not approved.
      setError(
        partnerVerificationStatus === 'rejected'
          ? `Your application was rejected${user.rejection_reason ? `: ${user.rejection_reason}` : ''}`
          : isClarification
            ? 'Your application needs clarification. Please contact admin.'
            : 'Your application is pending approval. Please wait for admin verification.',
      )
    }
    if (partnerIsActive === false) {
      setError((prev) => prev || 'Your partner account is inactive. Please contact admin.')
    }
  }, [user, partnerVerificationStatus, partnerIsActive])
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', password: '' })

  const mapRef = useRef<PartnerMapHandle | null>(null)
  const {
    hub,
    requestLiveHub,
    isRequesting: hubRequesting,
    error: hubError,
  } = usePartnerHubLocation()

  const lastHubSyncRef = useRef<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    if (!hub) return

    const prev = lastHubSyncRef.current
    const changed = !prev || prev.lat !== hub.lat || prev.lng !== hub.lng
    if (!changed) return
    lastHubSyncRef.current = { lat: hub.lat, lng: hub.lng }

    ;(async () => {
      try {
        await updatePartnerHubLocation({ latitude: hub.lat, longitude: hub.lng })
      } catch {
        // best-effort
      }
    })()
  }, [hub])

  const effectiveHub = useMemo(() => {
    if (hub) return hub
    const fromOrder = orders[0] ?? availableOrders[0]
    if (fromOrder) return { lat: fromOrder.latitude, lng: fromOrder.longitude }
    const fromAgent = agents.find((a) => a.latitude != null && a.longitude != null)
    if (fromAgent) return { lat: fromAgent.latitude as number, lng: fromAgent.longitude as number }
    return null
  }, [hub, orders, availableOrders, agents])

  const didAutoLocateRef = useRef(false)
  useEffect(() => {
    if (tab !== 'orders') return
    if (didAutoLocateRef.current) return
    if (viewMode !== 'map') return
    didAutoLocateRef.current = true
    ;(async () => {
      try {
        await requestLiveHub()
        mapRef.current?.backToHub()
      } catch {
        // permission denied/unavailable; error shown inline
      }
    })()
  }, [tab, requestLiveHub, viewMode])

  const updateCreditBalance = useCallback(async () => {
    try {
      const b = await getMyCreditBalance()
      if (b.success) setCreditBalance(Number(b.balance))
    } catch {
      // ignore
    }
  }, [])

  const acceptWithChoice = useCallback(
    async (order: PartnerOrder, useCredits: boolean) => {
      setAcceptingOrderId(order.id)
      try {
        const resp = await acceptOrder(order.id, { useCredits })
        if (!resp.success) {
          alert(resp.message || 'Failed to accept order')
          return
        }

        const payable =
          resp.partner_payable_price != null
            ? Number(resp.partner_payable_price)
            : resp.order?.partner_payable_price != null
              ? Number(resp.order.partner_payable_price)
              : Number(order.price ?? 0)
        const discount = resp.discount_amount != null ? Number(resp.discount_amount) : 0

        setAcceptedAtById((prev) => ({ ...prev, [order.id]: new Date().toISOString() }))
        setAcceptedOrderIds((prev) => new Set(prev).add(order.id))
        setAvailableOrders((prev) =>
          prev.map((x) =>
            x.id === order.id
              ? {
                  ...x,
                  ...(resp.order ? (resp.order as Partial<PartnerOrder>) : {}),
                  partner_accepted: true,
                  discount_amount: discount,
                  partner_payable_price: payable,
                  price: payable,
                  credits_charged: resp.credits_charged != null ? Number(resp.credits_charged) : (x as any).credits_charged,
                }
              : x,
          ),
        )

        setTakeOrdersFilter('accepted')
        if (useCredits) await updateCreditBalance()
        setAcceptPromptOrder(null)
      } catch (e: any) {
        const err = e as ApiError
        if (err?.status === 402) {
          const required = err?.data?.required_credits
          const balance = err?.data?.balance
          alert(
            required != null && balance != null
              ? `Insufficient Credits (need ${required}, have ${balance}). Please buy a plan.`
              : 'Insufficient Credits. Please buy a plan.',
          )
          setCreditsModalOpen(true)
          return
        }
        alert(err?.message || 'Failed to accept order')
      } finally {
        setAcceptingOrderId(null)
      }
    },
    [updateCreditBalance],
  )

  const refresh = useCallback(async (scope: 'all' | 'credits' = 'all') => {
    setLoading(true)
    setError(null)
    try {
      if (partnerVerificationStatus && partnerVerificationStatus !== 'approved') {
        return
      }
      if (partnerIsActive === false) {
        return
      }
      if (scope === 'credits') {
        const [b, p] = await Promise.all([getMyCreditBalance(), listMyCreditPlans()])
        if (b.success) setCreditBalance(Number(b.balance))
        if (p.success) setCreditPlans(p.plans)
        return
      }

      const [o, ao, a, b] = await Promise.all([
        getPartnerOrders(),
        getAvailableOrders(),
        getPartnerAgents(),
        getMyCreditBalance(),
      ])

      if (o.success) {
        setOrders(o.orders)
        const acceptedFromBackend = new Set(o.orders.filter((x) => x.partner_accepted).map((x) => x.id))
        setAcceptedOrderIds((prev) => {
          const next = new Set(prev)
          for (const id of acceptedFromBackend) next.add(id)
          return next
        })
      } else {
        setError('Failed to load orders')
      }

      if (ao?.success) setAvailableOrders(ao.orders)
      if (a?.success) setAgents(a.agents)
      if (b?.success) setCreditBalance(Number(b.balance))
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh')
    } finally {
      setLoading(false)
    }
  }, [
    partnerVerificationStatus,
    partnerIsActive,
    getMyCreditBalance,
    listMyCreditPlans,
    getPartnerOrders,
    getAvailableOrders,
    getPartnerAgents,
  ])

  const filteredOrders = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return orders
      .slice()
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .filter((o) => {
        if (!q) return true
        return (
          String(o.id).toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.phone_model.toLowerCase().includes(q)
        )
      })
      .filter((o) => (filters.status === 'all' ? true : o.status === filters.status))
  }, [orders, filters])

  // Orders tab must only show latest 6 (after filters)
  const latestSixFilteredOrders = useMemo(() => filteredOrders.slice(0, 6), [filteredOrders])

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

  const selectedAgent = useMemo(
    () => (selectedAgentId ? onlineAgents.find((a) => a.id === selectedAgentId) ?? null : null),
    [onlineAgents, selectedAgentId],
  )

  const selectedAgentOrders = useMemo(() => {
    if (!selectedAgentId) return []
    return orders
      .filter((o) => String(o.agent_id ?? '') === String(selectedAgentId))
      .slice()
      .sort((a, b) => {
        const aT = new Date(a.created_at ?? a.pickup_date ?? 0).getTime()
        const bT = new Date(b.created_at ?? b.pickup_date ?? 0).getTime()
        return bT - aT
      })
  }, [orders, selectedAgentId])

  const selectedAgentOrderGroups = useMemo(() => {
    const pending = selectedAgentOrders.filter((o) => o.status === 'pending')
    const inProgress = selectedAgentOrders.filter((o) => o.status === 'in-progress')
    const completed = selectedAgentOrders.filter((o) => o.status === 'completed')
    return { pending, inProgress, completed }
  }, [selectedAgentOrders])

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length
    const inProgress = orders.filter((o) => o.status === 'in-progress').length
    const completed = orders.filter((o) => o.status === 'completed').length
    return { pending, inProgress, completed }
  }, [orders])

  const mapOrders = useMemo<MapOrder[]>(
    () =>
      filteredOrders.map((o) => ({
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
    () => {
      if (!effectiveHub) return []
      return onlineAgents.map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone ?? '',
        liveStatus: a.isOnline ? 'pending' : 'offline',
        lastSeenAt: a.last_seen_at ?? new Date(0).toISOString(),
        location: { lat: a.latitude ?? effectiveHub.lat, lng: a.longitude ?? effectiveHub.lng },
      }))
    },
    [onlineAgents, effectiveHub],
  )

  const availableOrdersSorted = useMemo(() => {
    return availableOrders
      .slice()
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
  }, [availableOrders])

  const takeOrdersItems = useMemo(() => {
    // Unaccepted = only truly available/unassigned orders.
    if (takeOrdersFilter === 'unaccepted') {
      return availableOrdersSorted
        .map((o) => ({ o, isAccepted: acceptedOrderIds.has(o.id) }))
        .filter((x) => !x.isAccepted)
    }

    // Accepted = union of accepted available orders + accepted assigned orders.
    const acceptedAvailable = availableOrdersSorted
      .map((o) => ({ o, isAccepted: acceptedOrderIds.has(o.id) }))
      .filter((x) => x.isAccepted)

    const acceptedAssigned = orders
      .map((o) => ({ o, isAccepted: acceptedOrderIds.has(o.id) }))
      .filter((x) => x.isAccepted)

    const byId = new Map<string, { o: PartnerOrder; isAccepted: boolean }>()
    for (const x of acceptedAvailable) byId.set(x.o.id, x)
    for (const x of acceptedAssigned) byId.set(x.o.id, x)
    return Array.from(byId.values())
  }, [availableOrdersSorted, orders, takeOrdersFilter, acceptedOrderIds])

  const goToAcceptedSection = () => {
    setTab('take-orders')
    setTakeOrdersFilter('accepted')
  }

  const applyOrderAssignment = useCallback(
    (orderId: string, agentId: string) => {
      const agent = agents.find((a) => String(a.id) === String(agentId))
      const patch = (o: PartnerOrder): PartnerOrder =>
        o.id === orderId
          ? {
              ...o,
              agent_id: agentId,
              agent_name: agent?.name ?? o.agent_name ?? null,
              agent_phone: agent?.phone ?? o.agent_phone ?? null,
            }
          : o

      setOrders((prev) => prev.map(patch))
      setAvailableOrders((prev) => prev.map(patch))
    },
    [agents],
  )

  const realtimeOrderStatus = (o: PartnerOrder): { label: string; cls: string } => {
    if (o.status === 'completed') return { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' }
    if (o.status === 'in-progress') return { label: 'In Progress', cls: 'bg-blue-500/15 text-blue-700 border-blue-500/30' }

    // Pending in DB, but can be "declined" in UI if an agent returned it.
    if (acceptedOrderIds.has(o.id) && !o.agent_id && o.returned_at) {
      return { label: 'Declined', cls: 'bg-rose-500/15 text-rose-700 border-rose-500/30' }
    }

    return { label: 'Pending', cls: 'bg-slate-100 text-slate-700 border-slate-200' }
  }

  const AgentsPanel = ({ compactHeader = false }: { compactHeader?: boolean }) => (
    <>
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Agents</h2>
          {!compactHeader ? (
            <p className="text-sm text-slate-600">Live status is inferred from GPS updates (last 10 minutes = online).</p>
          ) : (
            <p className="text-sm text-slate-600">Live status is inferred from GPS updates.</p>
          )}
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {onlineAgents.map((a) => (
              <Card
                key={a.id}
                className={
                  'transition ' +
                  (selectedAgentId === a.id ? 'ring-2 ring-brand-500/30 border-brand-200' : 'hover:-translate-y-0.5')
                }
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedAgentId((prev) => (prev === a.id ? null : a.id))}
                >
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
                </button>
              </Card>
            ))}
          </div>

          {selectedAgent ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle>
                    Orders for <span className="font-semibold">{selectedAgent.name}</span>
                  </CardTitle>
                  <div className="text-xs text-slate-600">
                    Pending: {selectedAgentOrderGroups.pending.length} • In Progress: {selectedAgentOrderGroups.inProgress.length} • Completed: {selectedAgentOrderGroups.completed.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAgentOrders.length === 0 ? (
                  <div className="text-sm text-slate-600">No orders found for this agent.</div>
                ) : (
                  <div className="space-y-4">
                    {(
                      [
                        { key: 'pending', title: 'Pending', items: selectedAgentOrderGroups.pending },
                        { key: 'in-progress', title: 'In Progress', items: selectedAgentOrderGroups.inProgress },
                        { key: 'completed', title: 'Completed', items: selectedAgentOrderGroups.completed },
                      ] as const
                    )
                      .filter((g) => g.items.length > 0)
                      .map((g) => (
                        <div key={g.key} className="space-y-2">
                          <div className="text-sm font-semibold text-slate-900">{g.title}</div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            {g.items.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                className="text-left rounded-xl border bg-white p-3 hover:bg-slate-50 transition"
                                onClick={() => setAgentOrderPreview(o)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-900 truncate">{o.customer_name}</div>
                                    <div className="text-xs text-slate-600 truncate">#{o.order_number ?? o.id}</div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {(() => {
                                      const finalPrice = Number(o.price ?? 0)
                                      const orig = Number((o as any).original_price ?? finalPrice)
                                      const saved = Math.max(0, orig - finalPrice)
                                      return saved > 0 ? (
                                        <div>
                                          <div className="text-[11px] text-slate-500 line-through">₹{orig.toLocaleString()}</div>
                                          <div className="text-sm font-semibold">₹{finalPrice.toLocaleString()}</div>
                                          <div className="text-[11px] text-emerald-700">Saved ₹{saved.toLocaleString()}</div>
                                        </div>
                                      ) : (
                                        <div className="text-sm font-semibold">₹{finalPrice.toLocaleString()}</div>
                                      )
                                    })()}
                                    <div className="text-[11px] text-slate-500">{new Date(o.pickup_date).toDateString()}</div>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-600 truncate">
                                  {o.phone_model} • {o.phone_variant} • {o.phone_condition}
                                </div>
                                <div className="mt-1 text-xs text-slate-600 truncate">{o.full_address}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </>
  )

  return (
    <PartnerShell tab={tab} setTab={setTab} creditBalance={creditBalance}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Partner Dashboard</h1>
            <p className="text-sm text-slate-600">Orders matched by your service PIN code.</p>
          </div>
          <div className="flex-1" />
          {viewMode === 'map' ? (
            <div className="text-xs text-slate-500">
              Hub:{' '}
              {effectiveHub ? (
                <>
                  {effectiveHub.lat.toFixed(3)}, {effectiveHub.lng.toFixed(3)}
                </>
              ) : (
                'Not set'
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs text-slate-600 min-h-[1rem]">
            {error ? <span className="text-rose-700">{error}</span> : null}
          </div>
          <Button
            variant="secondary"
            onClick={() => refresh(tab === 'credits' ? 'credits' : 'all')}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={['h-4 w-4', loading ? 'animate-spin' : ''].join(' ')} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        {tab === 'orders' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">Credits</div>
                      <div className="text-2xl font-semibold">{creditBalance == null ? '—' : creditBalance}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          const r = await listMyCreditPlans()
                          if (r.success) setCreditPlans(r.plans)
                        } catch {
                          // ignore
                        } finally {
                          setCreditsModalOpen(true)
                        }
                      }}
                    >
                      Buy
                    </Button>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">Used when accepting an order.</div>
                </CardContent>
              </Card>
            </div>

            <OrderFilters
              value={filters}
              onChange={setFilters}
              withinCount={filteredOrders.length}
              statusOptions={{
                pending: 'Pending',
                'in-progress': 'In Progress',
                completed: 'Completed',
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      await requestLiveHub()
                      mapRef.current?.backToHub()
                    } catch {
                      // error shown inline
                    }
                  }}
                  disabled={hubRequesting}
                >
                  <MapPin className={['h-4 w-4', hubRequesting ? 'animate-pulse' : ''].join(' ')} />
                  {hubRequesting ? 'Locating…' : 'Use live hub location'}
                </Button>

                {ordersPanel === 'orders' && viewMode === 'map' ? (
                  <Button variant="secondary" size="sm" onClick={() => mapRef.current?.backToHub()}>
                    Back to hub
                  </Button>
                ) : null}

                {hubError ? <div className="text-xs text-rose-700">{hubError}</div> : null}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="inline-flex rounded-xl border bg-white p-1 shadow-soft">
                <Button
                  size="sm"
                  variant={ordersPanel === 'orders' ? 'primary' : 'ghost'}
                  onClick={() => setOrdersPanel('orders')}
                >
                  Orders
                </Button>
                <Button
                  size="sm"
                  variant={ordersPanel === 'agents' ? 'primary' : 'ghost'}
                  onClick={() => setOrdersPanel('agents')}
                >
                  Agents
                </Button>
              </div>

              {ordersPanel === 'orders' ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'map' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('map')}
                  >
                    <MapIcon className="h-4 w-4" /> Map view
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('list')}
                  >
                    <ListIcon className="h-4 w-4" /> List view
                  </Button>
                  <div className="text-sm text-slate-600">{filteredOrders.length} orders</div>
                </div>
              ) : null}
            </div>

            {ordersPanel === 'agents' ? (
              <AgentsPanel compactHeader />
            ) : viewMode === 'list' ? (
              <>
                {filteredOrders.length === 0 ? (
                  <Card>
                    <CardContent className="p-5 text-sm text-slate-600">No orders match the current filters.</CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredOrders.map((o) => (
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
                                #{o.order_number ?? o.id} • PIN {o.pincode || '—'}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {(() => {
                                const finalPrice = Number(o.price ?? 0)
                                const orig = Number((o as any).original_price ?? finalPrice)
                                const saved = Math.max(0, orig - finalPrice)
                                return saved > 0 ? (
                                  <div>
                                    <div className="text-xs text-slate-500 line-through">₹{orig.toLocaleString()}</div>
                                    <div className="font-semibold">₹{finalPrice.toLocaleString()}</div>
                                    <div className="text-xs text-emerald-700">Saved ₹{saved.toLocaleString()}</div>
                                  </div>
                                ) : (
                                  <div className="font-semibold">₹{finalPrice.toLocaleString()}</div>
                                )
                              })()}
                              <div className="text-xs text-slate-500">{new Date(o.pickup_date).toDateString()}</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-slate-700 break-words">{o.full_address}</div>
                          <div className="mt-2 text-xs text-slate-600">
                            {o.phone_model} • {o.phone_variant} • {o.phone_condition}
                          </div>

                          {o.agent_id && o.agent_name ? (
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-slate-700">Assigned Agent</div>
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                    o.status === 'completed'
                                      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                                      : o.status === 'in-progress'
                                        ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                                        : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                                  }`}
                                >
                                  {statusLabel(o.status)}
                                </span>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <div className="font-medium text-slate-900">{o.agent_name}</div>
                                <div className="text-xs text-slate-600 mt-1">{o.agent_phone ?? 'No phone'}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                              <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Assign agent
                              </div>
                              <div className="flex-1" />
                              <div className="w-full sm:w-72">
                                <select
                                  key={`${o.id}-orders-assign-grid`}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                                  defaultValue=""
                                  onChange={async (e) => {
                                    const agentId = e.target.value
                                    if (!agentId) return
                                    const resp = await assignOrderToAgent(o.id, agentId)
                                    if (!resp.success) {
                                      alert(resp.message || 'Failed to assign order')
                                      return
                                    }
                                    applyOrderAssignment(o.id, agentId)
                                  }}
                                >
                                  <option value="" disabled>
                                    Select agent
                                  </option>
                                  {onlineAgents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name}{a.isOnline ? ' ✓' : ' (offline)'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-4">
                {effectiveHub ? (
                  <PartnerMap
                    ref={mapRef}
                    hub={effectiveHub}
                    radiusKm={5}
                    orders={mapOrders}
                    agents={mapAgents}
                  />
                ) : (
                  <Card className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-slate-900">Fetching live location…</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Please allow location access so the map can center on your live hub.
                      </div>
                      {hubError ? <div className="mt-2 text-sm text-rose-700">{hubError}</div> : null}
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            try {
                              await requestLiveHub()
                              mapRef.current?.backToHub()
                            } catch {
                              // error shown inline
                            }
                          }}
                          disabled={hubRequesting}
                        >
                          <MapPin className={['h-4 w-4', hubRequesting ? 'animate-pulse' : ''].join(' ')} />
                          {hubRequesting ? 'Locating…' : 'Use live hub location'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {filteredOrders.length > 6 ? (
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="text-sm text-slate-700">
                          Showing latest 6 orders. View more in <span className="font-medium">Accepted</span>.
                        </div>
                        <Button size="sm" variant="secondary" onClick={goToAcceptedSection}>
                          View all accepted
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null}

                  {latestSixFilteredOrders.length === 0 ? (
                    <Card>
                      <CardContent className="p-5 text-sm text-slate-600">No orders match the current filters.</CardContent>
                    </Card>
                  ) : (
                    latestSixFilteredOrders.map((o) => (
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
                                #{o.order_number ?? o.id} • PIN {o.pincode || '—'}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {(() => {
                                const finalPrice = Number(o.price ?? 0)
                                const orig = Number((o as any).original_price ?? finalPrice)
                                const saved = Math.max(0, orig - finalPrice)
                                return saved > 0 ? (
                                  <div>
                                    <div className="text-xs text-slate-500 line-through">₹{orig.toLocaleString()}</div>
                                    <div className="font-semibold">₹{finalPrice.toLocaleString()}</div>
                                    <div className="text-xs text-emerald-700">Saved ₹{saved.toLocaleString()}</div>
                                  </div>
                                ) : (
                                  <div className="font-semibold">₹{finalPrice.toLocaleString()}</div>
                                )
                              })()}
                              <div className="text-xs text-slate-500">{new Date(o.pickup_date).toDateString()}</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-slate-700 break-words">{o.full_address}</div>
                          <div className="mt-2 text-xs text-slate-600">
                            {o.phone_model} • {o.phone_variant} • {o.phone_condition}
                          </div>

                          {o.agent_id && o.agent_name ? (
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-slate-700">Assigned Agent</div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  o.status === 'completed'
                                    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                                    : o.status === 'in-progress'
                                      ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                                      : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                                }`}>
                                  {statusLabel(o.status)}
                                </span>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3">
                                <div className="font-medium text-slate-900">{o.agent_name}</div>
                                <div className="text-xs text-slate-600 mt-1">{o.agent_phone ?? 'No phone'}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                              <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Assign agent
                              </div>
                              <div className="flex-1" />
                              <div className="w-full sm:w-72">
                                <select
                                  key={`${o.id}-orders-assign`}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                                  defaultValue=""
                                  onChange={async (e) => {
                                    const agentId = e.target.value
                                    if (!agentId) return
                                    const resp = await assignOrderToAgent(o.id, agentId)
                                    if (!resp.success) {
                                      alert(resp.message || 'Failed to assign order')
                                      return
                                    }
                                    applyOrderAssignment(o.id, agentId)
                                  }}
                                >
                                  <option value="" disabled>
                                    Select agent
                                  </option>
                                  {onlineAgents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name}{a.isOnline ? ' ✓' : ' (offline)'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}

        {tab === 'agents' ? (
          <AgentsPanel />
        ) : null}

        {tab === 'credits' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Card>
                <CardHeader>
                  <CardTitle>Credit Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{creditBalance == null ? '—' : creditBalance}</div>
                  <div className="mt-1 text-xs text-slate-500">Credits are deducted when you accept an order.</div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Buy Credit Packs</CardTitle>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        try {
                          const r = await listMyCreditPlans()
                          if (r.success) setCreditPlans(r.plans)
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Load packs
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {creditPlans.length === 0 ? (
                    <div className="text-sm text-slate-600">No packs loaded yet. Click “Load packs”.</div>
                  ) : (
                    <div className="space-y-2">
                      {creditPlans.map((p) => (
                        <div key={p.id} className="rounded-xl border bg-white p-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{p.plan_name}</div>
                            <div className="text-xs text-slate-600">
                              Credits: {Number(p.credit_amount)} • Price: ₹{Number(p.price).toLocaleString()}
                            </div>
                            {p.description ? <div className="text-xs text-slate-500 mt-1">{p.description}</div> : null}
                          </div>
                          <Button
                            size="sm"
                            disabled={buyingPlanId === p.id}
                            onClick={async () => {
                              setBuyingPlanId(p.id)
                              try {
                                const r = await buyCreditPlan(p.id)
                                if (!r.success) {
                                  alert(r.message || 'Failed to buy plan')
                                  return
                                }
                                if (r.balance != null) setCreditBalance(Number(r.balance))
                                else await updateCreditBalance()
                              } catch (e: any) {
                                alert(e?.message || 'Failed to buy plan')
                              } finally {
                                setBuyingPlanId(null)
                              }
                            }}
                          >
                            {buyingPlanId === p.id ? 'Buying…' : 'Buy'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        {tab === 'profile' ? (
          <>
            <Card>
              <div className="rounded-2xl border bg-white overflow-hidden">
                <div className="relative">
                  <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_30%,white,transparent_45%)]" />
                  <div className="absolute left-4 right-4 -bottom-10 flex items-end justify-between gap-3">
                    <div className="flex items-end gap-3">
                      <div className="h-20 w-20 rounded-2xl bg-white shadow-lg border flex items-center justify-center">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-semibold">
                          {(user?.name?.trim()?.[0] ?? 'P').toUpperCase()}
                        </div>
                      </div>
                      <div className="pb-2">
                        <div className="text-white text-lg font-semibold leading-tight">{user?.name ?? 'Partner'}</div>
                        <div className="text-slate-200 text-xs">{user?.company_name ?? '—'}</div>
                      </div>
                    </div>

                    <div className="pb-2">
                      <span
                        className={
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ' +
                          (user?.verification_status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
                            : user?.verification_status === 'pending'
                              ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                              : user?.verification_status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-200 border-rose-400/30'
                                : 'bg-slate-500/15 text-slate-200 border-slate-400/30')
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {user?.verification_status ?? '—'}
                      </span>
                      {user?.is_active === false ? (
                        <div className="mt-2 text-xs text-rose-200">Account is inactive</div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-14 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Profile</div>
                      <div className="text-xs text-slate-500">Your partner account details</div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const text = [
                          user?.name ? `Name: ${user.name}` : null,
                          user?.phone ? `Phone: ${user.phone}` : null,
                          user?.company_name ? `Company: ${user.company_name}` : null,
                          user?.gst_number ? `GST: ${user.gst_number}` : null,
                          user?.pan_number ? `PAN: ${user.pan_number}` : null,
                          user?.business_address ? `Address: ${user.business_address}` : null,
                        ]
                          .filter(Boolean)
                          .join('\n')
                        try {
                          await navigator.clipboard.writeText(text || '')
                          alert('Copied')
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-slate-500">Phone</div>
                      <div className="mt-1 font-semibold text-slate-900">{user?.phone ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-slate-500">Company</div>
                      <div className="mt-1 font-semibold text-slate-900">{user?.company_name ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 sm:col-span-2">
                      <div className="text-xs text-slate-500">Business address</div>
                      <div className="mt-1 font-semibold text-slate-900 break-words">{user?.business_address ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-slate-500">GST</div>
                      <div className="mt-1 font-semibold text-slate-900 break-all">{user?.gst_number ?? '—'}</div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-slate-500">PAN</div>
                      <div className="mt-1 font-semibold text-slate-900 break-all">{user?.pan_number ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
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
              <div className="text-xs text-slate-600">Phone </div>
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
                    if (resp.agent) setAgents((prev) => [resp.agent as PartnerAgent, ...prev])
                    setCreateForm({ name: '', phone: '', email: '', password: '' })
                    setCreateOpen(false)
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

        <Modal
          open={!!agentOrderPreview}
          title="Order Details"
          onClose={() => setAgentOrderPreview(null)}
        >
          {agentOrderPreview ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{agentOrderPreview.customer_name}</div>
                  <div className="text-xs text-slate-600">#{agentOrderPreview.order_number ?? agentOrderPreview.id}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{Number(agentOrderPreview.price).toLocaleString()}</div>
                  <div className="text-xs text-slate-600">{new Date(agentOrderPreview.pickup_date).toDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-slate-500">Device</div>
                  <div className="mt-1 text-slate-900 font-medium">{agentOrderPreview.phone_model}</div>
                  <div className="text-xs text-slate-600">{agentOrderPreview.phone_variant} • {agentOrderPreview.phone_condition}</div>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="mt-1 text-slate-900 font-medium">{agentOrderPreview.status}</div>
                  <div className="text-xs text-slate-600">Time slot: {agentOrderPreview.time_slot ?? '—'}</div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-slate-500">Pickup address</div>
                <div className="mt-1 text-slate-900">{agentOrderPreview.full_address}</div>
                <div className="mt-1 text-xs text-slate-600">
                  {agentOrderPreview.city ?? '—'}{agentOrderPreview.pincode ? ` • ${agentOrderPreview.pincode}` : ''}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-slate-500">Customer contact</div>
                <div className="mt-1 text-slate-900">{agentOrderPreview.customer_phone ?? '—'}</div>
              </div>
            </div>
          ) : null}
        </Modal>

        <Modal open={creditsModalOpen} title="Buy Credits" onClose={() => setCreditsModalOpen(false)}>
          <div className="space-y-3">
            <div className="text-sm text-slate-700">
              Current balance: <span className="font-semibold">{creditBalance == null ? '—' : creditBalance}</span>
            </div>

            {creditPlans.length === 0 ? (
              <div className="text-sm text-slate-600">
                No plans loaded yet. Try again.
              </div>
            ) : (
              <div className="space-y-2">
                {creditPlans.map((p) => (
                  <div key={p.id} className="rounded-xl border bg-white p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{p.plan_name}</div>
                      <div className="text-xs text-slate-600">
                        Credits: {Number(p.credit_amount)} • Price: ₹{Number(p.price).toLocaleString()}
                      </div>
                      {p.description ? <div className="text-xs text-slate-500 mt-1">{p.description}</div> : null}
                    </div>
                    <Button
                      size="sm"
                      disabled={buyingPlanId === p.id}
                      onClick={async () => {
                        setBuyingPlanId(p.id)
                        try {
                          const r = await buyCreditPlan(p.id)
                          if (!r.success) {
                            alert(r.message || 'Failed to buy plan')
                            return
                          }
                          if (r.balance != null) setCreditBalance(Number(r.balance))
                          else await updateCreditBalance()
                          setCreditsModalOpen(false)
                        } catch (e: any) {
                          alert(e?.message || 'Failed to buy plan')
                        } finally {
                          setBuyingPlanId(null)
                        }
                      }}
                    >
                      {buyingPlanId === p.id ? 'Buying…' : 'Buy'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>

        <Modal
          open={!!acceptPromptOrder}
          title="Order details"
          className="max-w-5xl"
          onClose={() => {
            if (!acceptingOrderId) {
              setAcceptPromptOrder(null)
              setAcceptPromptStep('details')
            }
          }}
        >
          {acceptPromptOrder ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-700">
                    Order <span className="font-semibold">#{acceptPromptOrder.order_number ?? acceptPromptOrder.id}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {acceptPromptOrder.pickup_date ? new Date(acceptPromptOrder.pickup_date).toDateString() : null}
                    {acceptPromptOrder.time_slot ? ` • ${acceptPromptOrder.time_slot}` : ''}
                  </div>
                </div>

                <div className="rounded-lg border bg-white px-3 py-2 text-right">
                  <div className="text-[11px] text-slate-500">PIN Code</div>
                  <div className="text-sm font-semibold text-slate-900">{acceptPromptOrder.pincode || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-white overflow-hidden">
                  <div className="aspect-[4/3] bg-slate-50">
                    <img
                      src="/images/phone-placeholder.svg"
                      alt="Phone"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-xs text-slate-500">Device</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">
                        {acceptPromptOrder.phone_model}{acceptPromptOrder.phone_variant ? ` • ${acceptPromptOrder.phone_variant}` : ''}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">Condition: {acceptPromptOrder.phone_condition || '—'}</div>
                    </div>

                    <div className="rounded-xl border bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Price</div>
                      <div className="mt-1 font-semibold text-slate-900 tabular-nums">₹{Number(acceptPromptOrder.price ?? 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 space-y-4">
                  <div>
                    <div className="text-xs text-slate-500">Customer</div>
                    <div className="mt-1 font-semibold text-slate-900">{acceptPromptOrder.customer_name || '—'}</div>
                    <div className="mt-1 text-sm text-slate-600">{acceptPromptOrder.customer_phone || '—'}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Pickup address</div>
                    <div className="mt-1 text-sm text-slate-900 break-words">{acceptPromptOrder.full_address || '—'}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {acceptPromptOrder.city ?? '—'}
                      {acceptPromptOrder.state ? `, ${acceptPromptOrder.state}` : ''}
                      {acceptPromptOrder.pincode ? ` • ${acceptPromptOrder.pincode}` : ''}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Pickup location</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {Number(acceptPromptOrder.latitude).toFixed(4)}, {Number(acceptPromptOrder.longitude).toFixed(4)}
                      </div>
                      <a
                        className="mt-1 inline-block text-xs text-brand-600 hover:text-brand-700"
                        href={`https://www.google.com/maps?q=${encodeURIComponent(
                          `${acceptPromptOrder.latitude},${acceptPromptOrder.longitude}`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Google Maps
                      </a>
                    </div>

                    <div className="rounded-xl border bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Hub location</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {effectiveHub ? `${effectiveHub.lat.toFixed(4)}, ${effectiveHub.lng.toFixed(4)}` : '—'}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Service PIN: {acceptPromptOrder.pincode || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 space-y-3">
                  {(() => {
                    const price = Number(acceptPromptOrder.price ?? 0)
                    const requiredCredits = Number(acceptPromptOrder.required_credits ?? acceptPromptOrder.credits ?? 0)
                    const maxDiscount = Number(
                      (acceptPromptOrder as any).potential_discount_amount ?? acceptPromptOrder.max_discount_rupees ?? 0,
                    )
                    const payableWithCredits = Math.max(0, price - maxDiscount)
                    return (
                      <>
                        <div>
                          <div className="text-xs text-slate-500">Credits</div>
                          <div className="mt-1 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border bg-slate-50 p-3">
                              <div className="text-[11px] text-slate-500">Your credits</div>
                              <div className="mt-1 font-semibold text-slate-900 tabular-nums break-all">
                                {creditBalance == null ? '—' : Number(creditBalance).toLocaleString()}
                              </div>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-3">
                              <div className="text-[11px] text-slate-500">Required</div>
                              <div className="mt-1 font-semibold text-slate-900 tabular-nums">{requiredCredits.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Max discount</div>
                          {maxDiscount > 0 ? (
                            <div className="mt-1 font-semibold text-emerald-700 tabular-nums">₹{maxDiscount.toLocaleString()}</div>
                          ) : (
                            <div className="mt-1 text-sm text-slate-600">—</div>
                          )}
                          {maxDiscount > 0 ? (
                            <div className="mt-1 text-[11px] text-slate-500">Applied only if you choose “Use credits”.</div>
                          ) : null}
                        </div>

                        <div>
                          <div className="text-xs text-slate-500">Payment</div>
                          <div className="mt-1 grid grid-cols-1 gap-3">
                            <div className="rounded-xl border bg-slate-50 p-3">
                              <div className="text-[11px] text-slate-500">Payable (without credits)</div>
                              <div className="mt-1 font-semibold text-slate-900 tabular-nums">₹{price.toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-3">
                              <div className="text-[11px] text-slate-500">Payable (with credits)</div>
                              <div className="mt-1 font-semibold text-slate-900 tabular-nums">₹{payableWithCredits.toLocaleString()}</div>
                              {maxDiscount > 0 ? (
                                <div className="mt-1 text-xs text-emerald-700">Saves up to ₹{maxDiscount.toLocaleString()}</div>
                              ) : (
                                <div className="mt-1 text-xs text-slate-500">No discount configured.</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          {acceptPromptStep === 'details' ? (
                            <div className="space-y-2">
                              <Button
                                variant="secondary"
                                disabled={!!acceptingOrderId}
                                onClick={() => {
                                  if (acceptingOrderId) return
                                  setAcceptPromptOrder(null)
                                  setAcceptPromptStep('details')
                                }}
                                className="w-full"
                              >
                                Close
                              </Button>
                              <Button
                                disabled={!!acceptingOrderId}
                                onClick={() => setAcceptPromptStep('payment')}
                                className="w-full"
                              >
                                Continue
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Button
                                variant="secondary"
                                disabled={!!acceptingOrderId}
                                onClick={() => setAcceptPromptStep('details')}
                                className="w-full"
                              >
                                Back
                              </Button>
                              <Button
                                variant="secondary"
                                disabled={!!acceptingOrderId}
                                onClick={() => acceptWithChoice(acceptPromptOrder, false)}
                                className="w-full"
                              >
                                Accept without credits
                              </Button>
                              <Button
                                disabled={!!acceptingOrderId}
                                onClick={() => acceptWithChoice(acceptPromptOrder, true)}
                                className="w-full"
                              >
                                Use credits & accept
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>

        {tab === 'take-orders' ? (
          <>
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Take Orders</h1>
                <p className="text-sm text-slate-600">Available orders waiting for acceptance or assignment.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTakeOrdersFilter('unaccepted')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    takeOrdersFilter === 'unaccepted'
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Unaccepted
                </button>
                <button
                  onClick={() => setTakeOrdersFilter('accepted')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    takeOrdersFilter === 'accepted'
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Accepted
                </button>
              </div>

              {takeOrdersItems.length === 0 ? (
                <Card>
                  <CardContent className="p-5 text-sm text-slate-600">No orders matching this filter.</CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {takeOrdersItems
                    .slice()
                    .sort((a, b) => {
                      // Accepted section: order should return to top when agent declines/cancels.
                      // Use backend returned_at when present; otherwise use local accepted timestamp.
                      const aAcceptedAt = Date.parse(acceptedAtById[a.o.id] ?? '')
                      const bAcceptedAt = Date.parse(acceptedAtById[b.o.id] ?? '')
                      const aReturnedAt = Date.parse(a.o.returned_at ?? '')
                      const bReturnedAt = Date.parse(b.o.returned_at ?? '')
                      const aKey = Math.max(Number.isFinite(aReturnedAt) ? aReturnedAt : 0, Number.isFinite(aAcceptedAt) ? aAcceptedAt : 0)
                      const bKey = Math.max(Number.isFinite(bReturnedAt) ? bReturnedAt : 0, Number.isFinite(bAcceptedAt) ? bAcceptedAt : 0)
                      return bKey - aKey
                    })
                    .map(({ o }) => (
                    <Card key={o.id} className="transition hover:-translate-y-0.5">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="flex items-center gap-2">
                              <span className="font-semibold truncate">{o.customer_name}</span>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                                acceptedOrderIds.has(o.id)
                                  ? 'bg-green-500/15 text-green-700 border-green-500/30'
                                  : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                              }`}>
                                {acceptedOrderIds.has(o.id) ? 'Accepted' : 'Available'}
                              </span>
                            </CardTitle>
                            <div className="mt-1 text-xs text-slate-500">
                              #{o.order_number ?? o.id} • PIN {o.pincode || '—'}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {(() => {
                              const finalPrice = Number(o.price ?? 0)
                              const orig = Number((o as any).original_price ?? finalPrice)
                              const saved = Math.max(0, orig - finalPrice)
                              return saved > 0 ? (
                                <div>
                                  <div className="text-xs text-slate-500 line-through">₹{orig.toLocaleString()}</div>
                                  <div className="font-semibold">₹{finalPrice.toLocaleString()}</div>
                                  <div className="text-xs text-emerald-700">Saved ₹{saved.toLocaleString()}</div>
                                </div>
                              ) : (
                                <div className="font-semibold">₹{finalPrice.toLocaleString()}</div>
                              )
                            })()}
                            <div className="text-xs text-slate-500">Credits: {Number(o.required_credits ?? 0)}</div>
                            {Number((o as any).potential_discount_amount ?? 0) > 0 ? (
                              <div className="text-xs text-slate-500">Discount: up to ₹{Number((o as any).potential_discount_amount ?? 0).toLocaleString()}</div>
                            ) : null}
                            <div className="text-xs text-slate-500">{new Date(o.pickup_date).toDateString()}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm text-slate-700 break-words font-medium mb-1">Location</div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                            <div className="text-sm text-slate-600">{o.full_address}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-xs">
                            <div className="text-slate-600 font-medium mb-1 flex items-center gap-1">
                              <Smartphone className="h-3 w-3" />
                              Device
                            </div>
                            <div className="text-slate-700">{o.phone_model}</div>
                            <div className="text-slate-600 text-[11px]">{o.phone_variant}</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-slate-600 font-medium mb-1">Condition</div>
                            <div className="text-slate-700">{o.phone_condition}</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-slate-600 font-medium mb-1">Status</div>
                            {(() => {
                              const s = realtimeOrderStatus(o)
                              return (
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
                                  {s.label}
                                </span>
                              )
                            })()}
                          </div>
                          <div className="text-xs">
                            <div className="text-slate-600 font-medium mb-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Pickup
                            </div>
                            <div className="text-slate-700">{new Date(o.pickup_date).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:items-center">
                          {!acceptedOrderIds.has(o.id) ? (
                            <Button
                              onClick={() => {
                                setAcceptPromptOrder(o)
                                setAcceptPromptStep('details')
                              }}
                              disabled={!!acceptingOrderId}
                              size="sm"
                            >
                              Accept Order
                            </Button>
                          ) : (
                            <>
                              {o.agent_id ? (
                                <div className="w-full flex items-center justify-between gap-3">
                                  <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Assigned Agent
                                  </div>
                                  <div className="text-sm text-slate-800">
                                    {o.agent_name ?? o.agent_id}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Assign Agent
                                  </div>
                                  <div className="flex-1" />
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={!!returningOrderId || !!acceptingOrderId}
                                    onClick={async () => {
                                      if (returningOrderId || acceptingOrderId) return
                                      const ok = window.confirm('Release this order back to Unaccepted (make it available again)?')
                                      if (!ok) return
                                      setReturningOrderId(o.id)
                                      try {
                                        const resp = await unacceptOrder(o.id)
                                        if (!resp.success) {
                                          alert(resp.message || 'Failed to send order back')
                                          return
                                        }
                                        setAcceptedOrderIds((prev) => {
                                          const next = new Set(prev)
                                          next.delete(o.id)
                                          return next
                                        })
                                        setAcceptedAtById((prev) => {
                                          const next = { ...prev }
                                          delete next[o.id]
                                          return next
                                        })
                                        setTakeOrdersFilter('unaccepted')
                                        await updateCreditBalance()
                                        await refresh('all')
                                      } catch (e: any) {
                                        alert(e?.message || 'Failed to send order back')
                                      } finally {
                                        setReturningOrderId(null)
                                      }
                                    }}
                                  >
                                    {returningOrderId === o.id ? 'Releasing…' : 'Release order'}
                                  </Button>
                                  <div className="w-full sm:w-72">
                                    {(() => {
                                      const blocked = new Set(o.blocked_agent_ids ?? [])
                                      const selectableAgents = onlineAgents.filter((a) => !blocked.has(a.id))
                                      return (
                                        <select
                                          key={`${o.id}-assign`}
                                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                                          defaultValue=""
                                          onChange={async (e) => {
                                            const agentId = e.target.value
                                            if (!agentId) return
                                            const resp = await assignOrderToAgent(o.id, agentId)
                                            if (!resp.success) {
                                              alert(resp.message || 'Failed to assign order')
                                              return
                                            }
                                            applyOrderAssignment(o.id, agentId)
                                            setAcceptedOrderIds(prev => new Set(prev).add(o.id))
                                          }}
                                        >
                                          <option value="" disabled>
                                            Select agent
                                          </option>
                                          {selectableAgents.length === 0 ? (
                                            <option value="" disabled>
                                              No eligible agents
                                            </option>
                                          ) : null}
                                          {selectableAgents.map((a) => (
                                            <option key={a.id} value={a.id}>
                                              {a.name}{a.isOnline ? ' ✓' : ' (offline)'}
                                            </option>
                                          ))}
                                        </select>
                                      )
                                    })()}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

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
