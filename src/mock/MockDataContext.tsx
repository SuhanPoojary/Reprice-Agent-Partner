import React, { createContext, useContext, useMemo, useState } from 'react'
import { seedAgents, seedOrders } from './data'
import type { Agent, Order } from './types'
import type { AgentLiveStatus, OrderStatus } from '../lib/status'

type Ctx = {
  agents: Agent[]
  orders: Order[]
  assignOrder: (orderId: string, agentId: string) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  setAgentLiveStatus: (agentId: string, status: AgentLiveStatus) => void
  acceptOrder: (orderId: string) => void
  rejectOrder: (orderId: string) => void
  upsertAgent: (agent: Pick<Agent, 'id' | 'name' | 'phone'>) => void
  removeAgent: (agentId: string) => void
}

const MockDataContext = createContext<Ctx | null>(null)

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(() => seedAgents)
  const [orders, setOrders] = useState<Order[]>(() => seedOrders)

  const value = useMemo<Ctx>(
    () => ({
      agents,
      orders,
      assignOrder: (orderId, agentId) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  assignedAgentId: agentId,
                  agentDecision: 'pending',
                  status: o.status === 'pending' ? 'pending' : o.status,
                }
              : o,
          ),
        )
      },
      updateOrderStatus: (orderId, status) => {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
      },
      setAgentLiveStatus: (agentId, status) => {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId ? { ...a, liveStatus: status, lastSeenAt: new Date().toISOString() } : a,
          ),
        )
      },
      acceptOrder: (orderId) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, agentDecision: 'accepted', status: 'on_the_way' } : o)),
        )
      },
      rejectOrder: (orderId) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, agentDecision: 'rejected' } : o)),
        )
      },
      upsertAgent: (agent) => {
        setAgents((prev) => {
          const existing = prev.find((a) => a.id === agent.id)
          if (!existing) {
            return [
              ...prev,
              {
                id: agent.id,
                name: agent.name,
                phone: agent.phone,
                liveStatus: 'pending',
                lastSeenAt: new Date().toISOString(),
                location: { lat: 19.076, lng: 72.8777 },
              },
            ]
          }
          return prev.map((a) => (a.id === agent.id ? { ...a, name: agent.name, phone: agent.phone } : a))
        })
      },
      removeAgent: (agentId) => {
        setAgents((prev) => prev.filter((a) => a.id !== agentId))
        setOrders((prev) => prev.map((o) => (o.assignedAgentId === agentId ? { ...o, assignedAgentId: null } : o)))
      },
    }),
    [agents, orders],
  )

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider')
  return ctx
}
