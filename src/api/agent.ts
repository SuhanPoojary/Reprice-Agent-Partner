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

export type OrderActionResponse = {
  success: boolean
  message?: string
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

export async function startPickup(orderId: string | number) {
  // If backend supports "start" for already-assigned orders, use it.
  try {
    return await apiFetch<OrderActionResponse>(`/orders/${orderId}/start`, { method: 'PATCH' })
  } catch (e: any) {
    // Older backend / different route: fallback to assign.
    if (e?.status === 404 || e?.status === 405) {
      return await apiFetch<OrderActionResponse>(`/orders/${orderId}/assign`, { method: 'PATCH' })
    }
    throw e
  }
}

// For pending orders: agent declines/unassigns (separate from canceling an in-progress pickup).
export async function declinePickup(orderId: string | number) {
  try {
    return await apiFetch<OrderActionResponse>(`/orders/${orderId}/decline`, { method: 'PATCH' })
  } catch (e: any) {
    // Fallback if backend uses /cancel for decline (legacy).
    if (e?.status === 404 || e?.status === 405) {
      return await apiFetch<OrderActionResponse>(`/orders/${orderId}/cancel`, { method: 'PATCH' })
    }
    throw e
  }
}

export async function completePickup(orderId: string) {
  return apiFetch<OrderActionResponse>(`/orders/${orderId}/complete`, { method: 'PATCH' })
}

export async function cancelPickup(orderId: string | number) {
  return apiFetch<OrderActionResponse>(`/orders/${orderId}/cancel`, { method: 'PATCH' })
}
