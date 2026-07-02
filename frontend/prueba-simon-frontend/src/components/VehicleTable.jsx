import { Loader2, MapPin, Trash2, Truck } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { formatClockTime } from '@/lib/time'
import { cn } from '@/lib/utils'

/**
 *
 * Resalta una fila (selectedId) sincroniza la selección con el mapa.
 */
export function VehicleTable({
  vehicles,
  isLoading,
  selectedId,
  onSelect,
  onDelete,
  deletingId,
}) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (vehicles.length === 0) {
    return <EmptyState />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="min-w-[9rem]">Vehículo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Última transmisión</TableHead>
          <TableHead>Coordenadas</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => {
          const isSelected = vehicle.vehicle_id === selectedId
          const isDeleting = vehicle.vehicle_id === deletingId
          return (
            <TableRow
              key={vehicle.vehicle_id}
              onClick={() => onSelect?.(vehicle.vehicle_id)}
              data-state={isSelected ? 'selected' : undefined}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Truck className="size-4" />
                  </span>
                  <span className="whitespace-nowrap font-medium tracking-tight">
                    {vehicle.vehicle_id}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={vehicle.status} />
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatClockTime(vehicle.last_seen)}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {vehicle.last_lat.toFixed(4)}, {vehicle.last_lng.toFixed(4)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete?.(vehicle.vehicle_id)
                  }}
                  aria-label={`Eliminar ${vehicle.vehicle_id}`}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="ml-auto h-4 w-32" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-16 text-center',
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Truck className="size-6" />
      </span>
      <p className="font-medium">Sin vehículos todavía</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Ejecuta el simulador de telemetría para empezar a recibir coordenadas
        GPS en tiempo real.
      </p>
    </div>
  )
}
