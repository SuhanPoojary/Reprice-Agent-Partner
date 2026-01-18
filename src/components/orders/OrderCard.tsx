import { Navigation, User } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Select } from '../ui/Select'
import { formatKm } from '../../lib/geo'
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL, type OrderStatus } from '../../lib/status'
import type { Agent, Order } from '../../mock/types'

export function OrderCard({
  order,
  distanceKm,
  agents,
  onAssign,
  showAssign,
  onStatusChange,
  showStatusControls,
  onAccept,
  onReject,
  showDecisionControls,
}: {
  order: Order
  distanceKm: number
  agents: Agent[]
  showAssign?: boolean
  onAssign?: (agentId: string) => void
  showStatusControls?: boolean
  onStatusChange?: (status: OrderStatus) => void
  showDecisionControls?: boolean
  onAccept?: () => void
  onReject?: () => void
}) {
  const assigned = agents.find((a) => a.id === order.assignedAgentId) ?? null

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${order.pickupLocation.lat},${order.pickupLocation.lng}`

  return (
    <Card className="transition hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="font-semibold">{order.id}</span>
              <Badge className={ORDER_STATUS_BADGE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              {new Date(order.createdAt).toLocaleString()} • {formatKm(distanceKm)} away
            </div>
          </div>

          <Button variant="secondary" size="sm" asChild>
            <a href={directionsUrl} target="_blank" rel="noreferrer">
              <Navigation className="h-4 w-4" /> Navigate
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Customer</div>
            <div className="mt-1 text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-slate-600" /> {order.customerName}
            </div>
            <div className="mt-1 text-xs text-slate-600">Phone: {order.phoneModel}</div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Pickup</div>
            <div className="mt-1 text-sm font-medium">{order.pickupAddress}</div>
            <div className="mt-1 text-xs text-slate-600">
              Assigned: {assigned ? assigned.name : 'Unassigned'}
            </div>
          </div>
        </div>

        {showAssign ? (
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="text-sm font-medium text-slate-700">Assign to agent</div>
            <div className="flex-1" />
            <div className="w-full sm:w-72">
              <Select
                value={order.assignedAgentId ?? ''}
                onChange={(e) => onAssign?.(e.target.value)}
              >
                <option value="" disabled>
                  Select agent
                </option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.liveStatus})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : null}

        {showDecisionControls ? (
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={onAccept} disabled={order.agentDecision !== 'pending'}>
              Accept
            </Button>
            <Button variant="danger" onClick={onReject} disabled={order.agentDecision !== 'pending'}>
              Reject
            </Button>
            <div className="ml-auto text-xs text-slate-600">
              Decision: <span className="font-medium">{order.agentDecision}</span>
            </div>
          </div>
        ) : null}

        {showStatusControls ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium text-slate-700">Update status</div>
            <div className="flex-1" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStatusChange?.('on_the_way')}
              disabled={order.status === 'completed'}
            >
              On the way
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStatusChange?.('picked')}
              disabled={order.status === 'completed'}
            >
              Picked
            </Button>
            <Button size="sm" onClick={() => onStatusChange?.('completed')} disabled={order.status === 'completed'}>
              Completed
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
