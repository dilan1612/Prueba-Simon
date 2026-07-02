import { Moon, RefreshCw, Satellite, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/time'


export function DashboardHeader({
  lastUpdated,
  now,
  isRefreshing,
  isOnline,
  onRefresh,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Satellite className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Telemetría de Flotas GPS
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo de vehículos en tiempo real
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="mr-1 flex flex-col items-end">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="relative flex size-2">
              {isOnline && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-moving opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex size-2 rounded-full',
                  isOnline ? 'bg-status-moving' : 'bg-status-nosignal'
                )}
              />
            </span>
            {isOnline ? 'En vivo' : 'Sin conexión'}
          </span>
          <span className="text-xs text-muted-foreground">
            Última actualización: {formatRelativeTime(lastUpdated, now)}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          aria-label="Actualizar ahora"
        >
          <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleTheme}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </div>
    </header>
  )
}
