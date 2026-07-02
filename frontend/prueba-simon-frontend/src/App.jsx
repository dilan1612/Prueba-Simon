import { useCallback, useState } from 'react'
import { AlertTriangle, MapPin, Plus, Radio } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { DashboardHeader } from '@/components/DashboardHeader'
import { FleetStats } from '@/components/FleetStats'
import { FleetMap } from '@/components/FleetMap'
import { VehicleTable } from '@/components/VehicleTable'
import { GpsForm } from '@/components/GpsForm'
import { useVehicles } from '@/hooks/useVehicles'
import { useNow } from '@/hooks/useNow'
import { useTheme } from '@/hooks/useTheme'
import { deleteVehicle, ApiError } from '@/lib/api'

const POLL_INTERVAL_MS = 5000

function App() {
  const { theme, toggleTheme } = useTheme()
  const { vehicles, isLoading, isRefreshing, error, lastUpdated, refetch } =
    useVehicles(POLL_INTERVAL_MS)
  const now = useNow()

  const [selectedId, setSelectedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleDelete = useCallback(
    async (vehicleId) => {
      setActionError(null)
      setDeletingId(vehicleId)
      try {
        await deleteVehicle(vehicleId)
        if (selectedId === vehicleId) setSelectedId(null)
        await refetch()
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'No se pudo eliminar el vehículo'
        setActionError(message)
      } finally {
        setDeletingId(null)
      }
    },
    [refetch, selectedId]
  )

  // "En línea" = la última consulta de polling fue exitosa.
  const isOnline = !error
  const banner = error ?? actionError

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          lastUpdated={lastUpdated}
          now={now}
          isRefreshing={isRefreshing}
          isOnline={isOnline}
          onRefresh={refetch}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="space-y-6 pt-6">
          {banner && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">
                  {error ? 'Problema de conexión con el backend' : 'Acción fallida'}
                </p>
                <p className="text-destructive/90">{banner}</p>
              </div>
            </div>
          )}

          <FleetStats vehicles={vehicles} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    Mapa de la flota
                  </CardTitle>
                  <CardDescription>
                    Última posición de cada vehículo
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[420px] w-full xl:h-[520px]">
                  <FleetMap
                    vehicles={vehicles}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="size-4 text-muted-foreground" />
                    Vehículos
                  </CardTitle>
                  <CardDescription>
                    {vehicles.length} vehículo{vehicles.length === 1 ? '' : 's'} en
                    seguimiento
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsFormOpen(true)}>
                  <Plus className="size-4" />
                  Nueva posición
                </Button>
              </CardHeader>
              <CardContent className="max-h-[520px] overflow-auto p-0">
                <VehicleTable
                  vehicles={vehicles}
                  isLoading={isLoading}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              </CardContent>
            </Card>
          </div>

        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <GpsForm
          existingVehicles={vehicles.map((v) => v.vehicle_id)}
          onCreated={refetch}
          onClose={() => setIsFormOpen(false)}
        />
      </Dialog>
    </div>
  )
}

export default App
