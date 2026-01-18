import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import type { Agent, Order } from '../../mock/types'

export function StatsCards({ agents, orders }: { agents: Agent[]; orders: Order[] }) {
  const pending = orders.filter((o) => o.status === 'pending').length
  const active = orders.filter((o) => o.status === 'on_the_way' || o.status === 'picked').length
  const completed = orders.filter((o) => o.status === 'completed').length

  const onlineAgents = agents.filter((a) => a.liveStatus !== 'offline').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <Card>
        <CardHeader>
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{pending}</div>
          <div className="text-xs text-slate-500">Waiting to be assigned/accepted</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Pickups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{active}</div>
          <div className="text-xs text-slate-500">On the way or picked</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{completed}</div>
          <div className="text-xs text-slate-500">Delivered successfully</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agents Online</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{onlineAgents}</div>
          <div className="text-xs text-slate-500">Not offline</div>
        </CardContent>
      </Card>
    </div>
  )
}
