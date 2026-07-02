import { useMemo } from 'react'
import { Navigation, Pause, Truck, WifiOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function FleetStats({ vehicles }) {
  const counts = useMemo(() => {
    const base = { total: vehicles.length, moving: 0, stopped: 0, noSignal: 0 }
    for (const v of vehicles) {
      if (v.status === 'En movimiento') base.moving += 1
      else if (v.status === 'Detenido') base.stopped += 1
      else if (v.status === 'Sin señal') base.noSignal += 1
    }
    return base
  }, [vehicles])

  const items = [
    { label: 'Total flota', value: counts.total, icon: Truck, accent: 'text-foreground', iconBg: 'bg-muted text-muted-foreground' },
    { label: 'En movimiento', value: counts.moving, icon: Navigation, accent: 'text-status-moving', iconBg: 'bg-status-moving/15 text-status-moving' },
    { label: 'Detenidos', value: counts.stopped, icon: Pause, accent: 'text-status-stopped', iconBg: 'bg-status-stopped/15 text-status-stopped' },
    { label: 'Sin señal', value: counts.noSignal, icon: WifiOff, accent: 'text-status-nosignal', iconBg: 'bg-status-nosignal/15 text-status-nosignal' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, accent, iconBg }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={cn('text-3xl font-semibold tabular-nums', accent)}>
                {value}
              </p>
            </div>
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-xl',
                iconBg
              )}
            >
              <Icon className="size-5" />
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
