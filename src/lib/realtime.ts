export type RealtimeMode = 'mock' | 'poll' | 'ws'

/**
 * Real-time ready wiring point.
 *
 * For now this app uses in-memory mock state, but the UI is structured
 * so you can swap to:
 * - polling: refresh every N seconds
 * - websocket: subscribe to order/agent updates
 */
export function getRealtimeMode(): RealtimeMode {
  const mode = (import.meta.env.VITE_REALTIME_MODE as RealtimeMode | undefined) ?? 'mock'
  if (mode === 'poll' || mode === 'ws' || mode === 'mock') return mode
  return 'mock'
}
