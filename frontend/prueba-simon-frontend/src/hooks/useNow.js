import { useEffect, useState } from 'react'

/**
 * Devuelve la marca de tiempo actual y se actualiza periódicamente
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
