import { GoogleMap, MarkerF, CircleF, useLoadScript } from '@react-google-maps/api'
import { useMemo } from 'react'
import type { LatLng } from '../../lib/geo'
import type { Order, Agent } from '../../mock/types'

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '420px',
  borderRadius: '16px',
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
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey ?? '',
  })

  const center = useMemo(() => hub, [hub])

  if (!apiKey) {
    return (
      <div className="rounded-2xl border bg-white shadow-soft p-5">
        <div className="text-sm font-semibold">Map disabled</div>
        <div className="mt-1 text-sm text-slate-600">
          Add <span className="font-medium">VITE_GOOGLE_MAPS_API_KEY</span> in this app’s `.env` to enable Google Maps.
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="rounded-2xl border bg-white shadow-soft p-5 text-sm text-slate-600">Loading map…</div>
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13} options={{ fullscreenControl: false }}>
      <MarkerF position={hub} label="P" />
      <CircleF
        center={hub}
        radius={radiusKm * 1000}
        options={{
          fillColor: '#1c86ff',
          fillOpacity: 0.08,
          strokeColor: '#1c86ff',
          strokeOpacity: 0.35,
          strokeWeight: 2,
        }}
      />

      {orders.map((o) => (
        <MarkerF key={o.id} position={o.pickupLocation} label="O" />
      ))}

      {agents
        .filter((a) => a.liveStatus !== 'offline')
        .map((a) => (
          <MarkerF key={a.id} position={a.location} label="A" />
        ))}
    </GoogleMap>
  )
}
