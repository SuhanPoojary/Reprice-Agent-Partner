import type { Agent, Order } from './types'

export const PARTNER_HUB = {
  lat: Number(import.meta.env.VITE_PARTNER_LAT ?? 19.076),
  lng: Number(import.meta.env.VITE_PARTNER_LNG ?? 72.8777),
}

export const seedAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Aman Patil',
    phone: '+91 90000 00001',
    liveStatus: 'pending',
    lastSeenAt: new Date().toISOString(),
    location: { lat: 19.078, lng: 72.879 },
  },
  {
    id: 'agent-2',
    name: 'Sara Khan',
    phone: '+91 90000 00002',
    liveStatus: 'on_the_way',
    lastSeenAt: new Date().toISOString(),
    location: { lat: 19.070, lng: 72.873 },
  },
  {
    id: 'agent-3',
    name: 'Rohit Joshi',
    phone: '+91 90000 00003',
    liveStatus: 'offline',
    lastSeenAt: new Date().toISOString(),
    location: { lat: 19.082, lng: 72.868 },
  },
]

export const seedOrders: Order[] = [
  {
    id: 'ord-1001',
    customerName: 'Neha Sharma',
    phoneModel: 'iPhone 13',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    pickupLocation: { lat: 19.075, lng: 72.882 },
    pickupAddress: 'Bandra West, Mumbai',
    assignedAgentId: null,
    agentDecision: 'pending',
  },
  {
    id: 'ord-1002',
    customerName: 'Vivek Singh',
    phoneModel: 'Samsung S21',
    status: 'on_the_way',
    createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    pickupLocation: { lat: 19.071, lng: 72.875 },
    pickupAddress: 'Andheri East, Mumbai',
    assignedAgentId: 'agent-2',
    agentDecision: 'accepted',
  },
  {
    id: 'ord-1003',
    customerName: 'Priya Nair',
    phoneModel: 'OnePlus 9',
    status: 'picked',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    pickupLocation: { lat: 19.081, lng: 72.871 },
    pickupAddress: 'Santacruz, Mumbai',
    assignedAgentId: 'agent-1',
    agentDecision: 'accepted',
  },
  {
    id: 'ord-1004',
    customerName: 'Rahul Mehta',
    phoneModel: 'Pixel 7',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
    pickupLocation: { lat: 19.073, lng: 72.869 },
    pickupAddress: 'Juhu, Mumbai',
    assignedAgentId: 'agent-1',
    agentDecision: 'accepted',
  },
]
