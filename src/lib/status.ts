export type OrderStatus = 'pending' | 'on_the_way' | 'picked' | 'completed'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  on_the_way: 'On the way',
  picked: 'Picked',
  completed: 'Completed',
}

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-slate-200 text-slate-800 border-slate-300',
  on_the_way: 'bg-blue-100 text-blue-800 border-blue-200',
  picked: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export type AgentLiveStatus = OrderStatus | 'offline'

export const AGENT_STATUS_LABEL: Record<AgentLiveStatus, string> = {
  offline: 'Offline',
  pending: 'Pending',
  on_the_way: 'On the way',
  picked: 'Picked',
  completed: 'Completed',
}

export const AGENT_STATUS_BADGE: Record<AgentLiveStatus, string> = {
  offline: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: ORDER_STATUS_BADGE.pending,
  on_the_way: ORDER_STATUS_BADGE.on_the_way,
  picked: ORDER_STATUS_BADGE.picked,
  completed: ORDER_STATUS_BADGE.completed,
}
