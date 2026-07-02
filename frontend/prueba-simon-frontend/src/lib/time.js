/**
 * Formatea la distancia entre `date` y ahora en español
 */
export function formatRelativeTime(date, now = Date.now()) {
  if (!date) return '—'
  const seconds = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000))

  if (seconds < 5) return 'hace un momento'
  if (seconds < 60) return `hace ${seconds} segundos`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  }

  const hours = Math.floor(minutes / 60)
  return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
}

export function formatClockTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
