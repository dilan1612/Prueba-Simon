import { useCallback, useEffect, useRef, useState } from 'react'
import { getVehicles } from '@/lib/api'

/**
 * useVehicles consulta GET /vehicles y refresca automáticamente cada
 */
export function useVehicles(intervalMs = 5000) {
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const isMounted = useRef(true)
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setIsRefreshing(true)
    try {
      const data = await getVehicles()
      if (!isMounted.current) return
      setVehicles(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      if (!isMounted.current) return
      setError(err.message)
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    load()
    const id = setInterval(load, intervalMs)
    return () => {
      isMounted.current = false
      clearInterval(id)
    }
  }, [load, intervalMs])

  return { vehicles, isLoading, isRefreshing, error, lastUpdated, refetch: load }
}
