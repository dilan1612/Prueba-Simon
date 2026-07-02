import { useState } from 'react'
import { AlertTriangle, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { postGpsCoordinate, ApiError } from '@/lib/api'

// Coordenada base de Bogotá, usada como placeholder de ejemplo.
const EXAMPLE = { lat: '4.7110', lng: '-74.0721' }


function validate({ vehicleId, lat, lng }) {
  const errors = {}

  if (!vehicleId.trim()) {
    errors.vehicleId = 'El ID del vehículo es obligatorio'
  }

  const latNum = Number(lat)
  if (lat === '' || Number.isNaN(latNum)) {
    errors.lat = 'Ingresa un número válido'
  } else if (latNum < -90 || latNum > 90) {
    errors.lat = 'Debe estar entre -90 y 90'
  }

  const lngNum = Number(lng)
  if (lng === '' || Number.isNaN(lngNum)) {
    errors.lng = 'Ingresa un número válido'
  } else if (lngNum < -180 || lngNum > 180) {
    errors.lng = 'Debe estar entre -180 y 180'
  }

  return errors
}

/**
 * Formulario para registrar una nueva coordenada GPS 
 */
export function GpsForm({ existingVehicles = [], onCreated, onClose }) {
  const [vehicleId, setVehicleId] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError(null)

    const fieldErrors = validate({ vehicleId, lat, lng })
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    try {
      await postGpsCoordinate({
        vehicle_id: vehicleId.trim(),
        lat: Number(lat),
        lng: Number(lng),
        timestamp: new Date().toISOString(),
      })
      await onCreated?.(vehicleId.trim())
      onClose?.()
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo registrar la coordenada'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nueva posición GPS</DialogTitle>
        <DialogDescription>
          Registra una coordenada para un vehículo. Si el ID ya existe, se
          actualiza su última ubicación.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 px-6 py-2">
        {submitError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <Field label="ID del vehículo" htmlFor="vehicle_id" error={errors.vehicleId}>
          <Input
            id="vehicle_id"
            list="existing-vehicles"
            placeholder="VH-001"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            autoFocus
          />
          <datalist id="existing-vehicles">
            {existingVehicles.map((id) => (
              <option key={id} value={id} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitud" htmlFor="lat" error={errors.lat}>
            <Input
              id="lat"
              type="number"
              step="any"
              placeholder={EXAMPLE.lat}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </Field>
          <Field label="Longitud" htmlFor="lng" error={errors.lng}>
            <Input
              id="lng"
              type="number"
              step="any"
              placeholder={EXAMPLE.lng}
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          El <span className="font-mono">timestamp</span> se genera
          automáticamente en formato ISO 8601 al enviar.
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Registrar posición
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({ label, htmlFor, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
