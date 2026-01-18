import { apiFetch } from './client'

export type PartnerAgent = {
  id: string
  name: string
  phone: string | null
  email?: string | null
  latitude: number | null
  longitude: number | null
  last_seen_at: string | null
  partner_id?: string | null
}

export type PartnerOrder = {
  id: string
  order_number?: string | null
  phone_model: string
  phone_variant: string
  phone_condition: string
  price: number
  status: 'pending' | 'in-progress' | 'completed'
  pickup_date: string
  time_slot?: string | null
  created_at?: string
  agent_id?: string | null

  customer_name: string
  customer_phone?: string | null

  full_address: string
  city?: string | null
  state?: string | null
  pincode?: string | null
  latitude: number
  longitude: number

  agent_name?: string | null
  agent_phone?: string | null
}

export async function getPartnerOrders() {
  return apiFetch<{ success: boolean; orders: PartnerOrder[] }>(`/partner/orders`, { method: 'GET' })
}

export async function getPartnerAgents() {
  return apiFetch<{ success: boolean; agents: PartnerAgent[] }>(`/partner/agents`, { method: 'GET' })
}

export async function assignOrderToAgent(orderId: string, agentId: string) {
  return apiFetch<{ success: boolean; order?: any; message?: string }>(`/partner/orders/${orderId}/assign-agent`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId }),
  })
}

export async function createPartnerAgent(input: {
  name: string
  phone?: string
  email?: string
  password: string
}) {
  return apiFetch<{ success: boolean; agent?: PartnerAgent; message?: string }>(`/partner/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
