import { useEffect, useState } from 'react'
import type { LatLng } from '../lib/geo'

type State =
  | { status: 'idle'; position: null; error: null }
  | { status: 'ok'; position: LatLng; error: null }
  | { status: 'error'; position: null; error: string }

export function useGeoLocation(enable: boolean) {
  const [state, setState] = useState<State>({ status: 'idle', position: null, error: null })

  useEffect(() => {
    if (!enable) return
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', position: null, error: 'Geolocation not supported' })
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          status: 'ok',
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
        })
      },
      (err) => {
        setState({ status: 'error', position: null, error: err.message })
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [enable])

  return state
}
