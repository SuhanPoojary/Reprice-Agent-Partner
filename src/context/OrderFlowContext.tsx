import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type OrderStatus = 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'

export interface OrderOverride {
  status?: OrderStatus
  agent_id?: string | null
  declinedAt?: Date
}

interface OrderFlowContextValue {
  declinedAgents: Map<string, string[]>
  orderOverrides: Map<string, OrderOverride>

  // local-only actions (no API calls)
  declineOrder: (orderId: string, agentId: string) => void
  cancelOrderByAgent: (orderId: string, agentId: string) => void
  assignAgentLocally: (orderId: string, agentId: string) => void

  // helpers
  isAgentDeclinedForOrder: (orderId: string, agentId: string) => boolean
  getAvailableAgentsForOrder: (orderId: string, allAgentIds: string[]) => string[]
  getOrderOverride: (orderId: string) => OrderOverride | undefined
  isOrderReturnedToPartner: (orderId: string) => boolean
}

const OrderFlowContext = createContext<OrderFlowContextValue | null>(null)

export function OrderFlowProvider({ children }: { children: ReactNode }) {
  const [declinedAgents, setDeclinedAgents] = useState<Map<string, string[]>>(() => new Map())
  const [orderOverrides, setOrderOverrides] = useState<Map<string, OrderOverride>>(() => new Map())

  const declineOrder = useCallback((orderId: string, agentId: string) => {
    setDeclinedAgents(prev => {
      const next = new Map(prev)
      const existing = next.get(orderId) ?? []
      if (!existing.includes(agentId)) next.set(orderId, [...existing, agentId])
      return next
    })

    setOrderOverrides(prev => {
      const next = new Map(prev)
      next.set(orderId, { agent_id: null, declinedAt: new Date() })
      return next
    })
  }, [])

  const cancelOrderByAgent = useCallback(
    (orderId: string, agentId: string) => {
      declineOrder(orderId, agentId)
    },
    [declineOrder],
  )

  const assignAgentLocally = useCallback((orderId: string, agentId: string) => {
    setOrderOverrides(prev => {
      const next = new Map(prev)
      const existing = next.get(orderId) ?? {}
      next.set(orderId, { ...existing, agent_id: agentId })
      return next
    })
  }, [])

  const isAgentDeclinedForOrder = useCallback(
    (orderId: string, agentId: string) => {
      const declined = declinedAgents.get(orderId) ?? []
      return declined.includes(agentId)
    },
    [declinedAgents],
  )

  const getAvailableAgentsForOrder = useCallback(
    (orderId: string, allAgentIds: string[]) => {
      const declined = declinedAgents.get(orderId) ?? []
      return allAgentIds.filter(id => !declined.includes(id))
    },
    [declinedAgents],
  )

  const getOrderOverride = useCallback(
    (orderId: string) => orderOverrides.get(orderId),
    [orderOverrides],
  )

  const isOrderReturnedToPartner = useCallback(
    (orderId: string) => {
      const o = orderOverrides.get(orderId)
      return o?.agent_id === null && o?.declinedAt !== undefined
    },
    [orderOverrides],
  )

  const value = useMemo<OrderFlowContextValue>(
    () => ({
      declinedAgents,
      orderOverrides,
      declineOrder,
      cancelOrderByAgent,
      assignAgentLocally,
      isAgentDeclinedForOrder,
      getAvailableAgentsForOrder,
      getOrderOverride,
      isOrderReturnedToPartner,
    }),
    [
      declinedAgents,
      orderOverrides,
      declineOrder,
      cancelOrderByAgent,
      assignAgentLocally,
      isAgentDeclinedForOrder,
      getAvailableAgentsForOrder,
      getOrderOverride,
      isOrderReturnedToPartner,
    ],
  )

  return <OrderFlowContext.Provider value={value}>{children}</OrderFlowContext.Provider>
}

export function useOrderFlow() {
  const ctx = useContext(OrderFlowContext)
  if (!ctx) throw new Error('useOrderFlow must be used within OrderFlowProvider')
  return ctx
}
