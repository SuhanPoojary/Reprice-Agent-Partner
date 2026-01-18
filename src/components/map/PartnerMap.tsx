import { useMemo } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { LatLng } from '../../lib/geo'
import type { Order, Agent } from '../../mock/types'

// Fix default marker icons with bundlers (Vite)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '420px',
  borderRadius: '16px',
  overflow: 'hidden',
}

function FitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap()
  // Avoid over-zooming when there is only one point.
  map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 })
  return null
}

export function PartnerMap({
  hub,
  radiusKm,
  orders,
  agents,
}: {
  hub: LatLng
  radiusKm: number
  orders: Order[]
  agents: Agent[]
}) {
  const center = useMemo(() => ({ lat: hub.lat, lng: hub.lng }), [hub.lat, hub.lng])

  const onlineAgents = useMemo(() => agents.filter((a) => a.liveStatus !== 'offline'), [agents])

  // Decorative "routes": draw a soft line from assigned agent → pickup.
  const routes = useMemo(() => {
    const byId = new Map(onlineAgents.map((a) => [String(a.id), a]))
    return orders
      .filter((o) => o.assignedAgentId)
      .map((o) => {
        const agent = byId.get(String(o.assignedAgentId))
        if (!agent) return null
        return {
          id: `route:${o.id}:${agent.id}`,
          from: agent.location,
          to: o.pickupLocation,
        }
      })
      .filter(Boolean) as Array<{ id: string; from: { lat: number; lng: number }; to: { lat: number; lng: number } }>
  }, [orders, onlineAgents])

  const bounds = useMemo(() => {
    const pts: Array<[number, number]> = [[hub.lat, hub.lng]]
    for (const o of orders) pts.push([o.pickupLocation.lat, o.pickupLocation.lng])
    for (const a of onlineAgents) pts.push([a.location.lat, a.location.lng])
    return L.latLngBounds(pts)
  }, [hub.lat, hub.lng, orders, onlineAgents])

  return (
    <div className="rounded-2xl border bg-white shadow-soft">
      <div style={containerStyle}>
        <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds bounds={bounds} />

          {/* Service radius */}
          <Circle
            center={[hub.lat, hub.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#2563eb', weight: 2, opacity: 0.35, fillColor: '#2563eb', fillOpacity: 0.08 }}
          />

          {/* Hub */}
          <CircleMarker
            center={[hub.lat, hub.lng]}
            radius={10}
            pathOptions={{ color: '#1d4ed8', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.95 }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              Partner hub
            </Tooltip>
          </CircleMarker>

          {/* Orders */}
          {orders.map((o) => (
            <CircleMarker
              key={o.id}
              center={[o.pickupLocation.lat, o.pickupLocation.lng]}
              radius={8}
              pathOptions={{ color: '#ea580c', weight: 2, fillColor: '#fb923c', fillOpacity: 0.95 }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                Pickup • {o.customerName}
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Agents */}
          {onlineAgents.map((a) => (
            <CircleMarker
              key={a.id}
              center={[a.location.lat, a.location.lng]}
              radius={7}
              pathOptions={{ color: '#16a34a', weight: 2, fillColor: '#4ade80', fillOpacity: 0.95 }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                Agent • {a.name}
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Decorative routes */}
          {routes.map((r) => (
            <Polyline
              key={r.id}
              positions={[
                [r.from.lat, r.from.lng],
                [r.to.lat, r.to.lng],
              ]}
              pathOptions={{ color: '#7c3aed', weight: 4, opacity: 0.35 }}
            />
          ))}
          {routes.map((r) => (
            <Polyline
              key={`${r.id}:dash`}
              positions={[
                [r.from.lat, r.from.lng],
                [r.to.lat, r.to.lng],
              ]}
              pathOptions={{ color: '#a78bfa', weight: 2, opacity: 0.9, dashArray: '8 10' }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Tiny legend overlay */}
      <div className="px-4 py-3 text-xs text-slate-600 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#60a5fa' }} /> Hub
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#fb923c' }} /> Pickup
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#4ade80' }} /> Agent
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6" style={{ background: '#a78bfa' }} /> Route
        </div>
      </div>
    </div>
  )
}
