import { apiFetch } from './client'

export type BackendOrder = {
  id: string
  phone_model: string
  phone_variant: string
  phone_condition: string
  price: number
  status: 'pending' | 'in-progress' | 'completed'
  pickup_date: string
  time_slot?: string
  customer_name: string
  customer_phone?: string
  full_address: string
  city?: string
  pincode?: string
  latitude: number
  longitude: number
  distance_km?: number
}

export type OrdersResponse = {
  success: boolean
  orders: BackendOrder[]
}

export async function updateAgentLocation(latitude: number, longitude: number) {
  return apiFetch<{ success: boolean; message?: string }>(`/agent/update-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  })
}

export async function getNearbyOrders() {
  return apiFetch<OrdersResponse>(`/agent/nearby-orders`, { method: 'GET' })
}

export async function getMyPickups() {
  return apiFetch<OrdersResponse>(`/agent/my-pickups`, { method: 'GET' })
}

export async function startPickup(orderId: string) {
  return apiFetch<any>(`/orders/${orderId}/assign`, { method: 'PATCH' })
}

export async function completePickup(orderId: string) {
  return apiFetch<any>(`/orders/${orderId}/complete`, { method: 'PATCH' })
}

export async function cancelPickup(orderId: string) {
  return apiFetch<any>(`/orders/${orderId}/cancel`, { method: 'PATCH' })
}
