import { Navigation, Pause, WifiOff } from 'lucide-react'


export const STATUS_CONFIG = {
  'En movimiento': {
    label: 'En movimiento',
    icon: Navigation,
    badgeClass:
      'border-status-moving/30 bg-status-moving/15 text-status-moving',
    dotClass: 'bg-status-moving',
    markerColor: 'var(--status-moving)',
    isLive: true,
  },
  Detenido: {
    label: 'Detenido',
    icon: Pause,
    badgeClass:
      'border-status-stopped/30 bg-status-stopped/15 text-status-stopped',
    dotClass: 'bg-status-stopped',
    markerColor: 'var(--status-stopped)',
    isLive: false,
  },
  'Sin señal': {
    label: 'Sin señal',
    icon: WifiOff,
    badgeClass:
      'border-status-nosignal/30 bg-status-nosignal/15 text-status-nosignal',
    dotClass: 'bg-status-nosignal',
    markerColor: 'var(--status-nosignal)',
    isLive: false,
  },
}

const FALLBACK = {
  label: 'Desconocido',
  icon: WifiOff,
  badgeClass: 'border-border bg-muted text-muted-foreground',
  dotClass: 'bg-muted-foreground',
  markerColor: 'var(--muted-foreground)',
  isLive: false,
}

/** Devuelve la configuración de un estado, con un fallback seguro. */
export function getStatusConfig(status) {
  return STATUS_CONFIG[status] ?? FALLBACK
}
