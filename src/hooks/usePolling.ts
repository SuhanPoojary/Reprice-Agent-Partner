import { useEffect, useRef } from 'react'

export function usePolling(cb: () => void, intervalMs: number, enabled: boolean) {
  const cbRef = useRef(cb)
  cbRef.current = cb

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => cbRef.current(), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, enabled])
}
