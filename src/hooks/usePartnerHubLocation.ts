import { useCallback, useState } from 'react'

export type HubLocation = { lat: number; lng: number }

const STORAGE_KEY = 'reprice.partner.hubLocation.v1'

function readStoredHub(): HubLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<HubLocation>
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') return null
    return { lat: parsed.lat, lng: parsed.lng }
  } catch {
    return null
  }
}

function storeHub(hub: HubLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hub))
  } catch {
    // ignore
  }
}

export function usePartnerHubLocation() {
  const [hub, setHubState] = useState<HubLocation | null>(() => readStoredHub())
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setHub = useCallback((next: HubLocation) => {
    setHubState(next)
    storeHub(next)
  }, [])

  const requestLiveHub = useCallback(async () => {
    setIsRequesting(true)
    setError(null)

    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error('Geolocation requires HTTPS (or http://localhost).')
      }
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocation not supported')
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setHub(next)
      return next
    } catch (e: any) {
      const msg =
        e?.code === 1
          ? 'Location permission denied.'
          : e?.code === 2
            ? 'Location unavailable.'
            : e?.code === 3
              ? 'Location request timed out.'
              : e?.message ?? 'Failed to fetch live location.'
      setError(msg)
      throw e
    } finally {
      setIsRequesting(false)
    }
  }, [setHub])

  return { hub, setHub, requestLiveHub, isRequesting, error }
}
