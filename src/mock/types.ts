import type { LatLng } from '../lib/geo'
import type { AgentLiveStatus, OrderStatus } from '../lib/status'

export type Order = {
  id: string
  customerName: string
  phoneModel: string
  status: OrderStatus
  createdAt: string
  pickupLocation: LatLng
  pickupAddress: string
  assignedAgentId: string | null
  agentDecision: 'pending' | 'accepted' | 'rejected'
}

export type Agent = {
  id: string
  name: string
  phone: string
  liveStatus: AgentLiveStatus
  lastSeenAt: string
  location: LatLng
}
