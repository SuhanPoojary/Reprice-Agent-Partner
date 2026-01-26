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
  original_price?: number | null
  discount_amount?: number | null
  partner_payable_price?: number | null
  status: 'pending' | 'in-progress' | 'completed'
  pickup_date: string
  time_slot?: string | null
  created_at?: string
  agent_id?: string | null
  partner_accepted?: boolean

  // Credits (backend computed)
  required_credits?: number
  credits?: number
  credit_product_key?: string
  discount_rupees_per_credit?: number
  max_discount_rupees?: number
  potential_discount_amount?: number
  partner_id?: string | null
  credits_charged?: number | null

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

  // Non-persistent (in-memory) backend hints
  blocked_agent_ids?: string[]
  returned_at?: string | null
}

export type PartnerCreditPlan = {
  id: number
  plan_name: string
  credit_amount: number
  price: number
  bonus_percentage: number
  description?: string | null
  is_active: boolean
}

export async function getPartnerOrders() {
  return apiFetch<{ success: boolean; orders: PartnerOrder[] }>(`/partner/orders`, { method: 'GET' })
}

export async function getAvailableOrders() {
  return apiFetch<{ success: boolean; orders: PartnerOrder[] }>(`/partner/orders/available`, { method: 'GET' })
}

export async function getPartnerAgents() {
  return apiFetch<{ success: boolean; agents: PartnerAgent[] }>(`/partner/agents`, { method: 'GET' })
}

export async function acceptOrder(orderId: string, opts?: { useCredits?: boolean }) {
  return apiFetch<{ success: boolean; order?: any; message?: string; used_credits?: boolean; credits_charged?: number; discount_amount?: number; partner_payable_price?: number }>(`/partner/orders/${orderId}/accept`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useCredits: opts?.useCredits }),
  })
}

export async function unacceptOrder(orderId: string) {
  return apiFetch<{ success: boolean; order?: any; message?: string; refunded_credits?: number }>(`/partner/orders/${orderId}/unaccept`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
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

export async function getMyCreditBalance() {
  return apiFetch<{ success: boolean; balance: number }>(`/partner/credits/balance`, { method: 'GET' })
}

export async function getMyCreditHistory(limit = 200) {
  return apiFetch<{ success: boolean; transactions: any[] }>(
    `/partner/credits/history?limit=${encodeURIComponent(String(limit))}`,
    { method: 'GET' },
  )
}

export async function listMyCreditPlans() {
  return apiFetch<{ success: boolean; plans: PartnerCreditPlan[] }>(`/partner/credits/plans`, { method: 'GET' })
}

export async function buyCreditPlan(planId: number | string) {
  return apiFetch<{ success: boolean; balance?: number; message?: string }>(`/partner/credits/plans/${planId}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}
