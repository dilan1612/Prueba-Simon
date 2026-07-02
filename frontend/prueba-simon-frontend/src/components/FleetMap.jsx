import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { getStatusConfig } from '@/lib/status'
import { formatClockTime } from '@/lib/time'

// Coordenadas por default
const DEFAULT_CENTER = [4.66, -74.08]
const DEFAULT_ZOOM = 12


function buildIcon(status) {
  const { markerColor, isLive } = getStatusConfig(status)
  return L.divIcon({
    className: '',
    html: `<div class="vehicle-marker${isLive ? ' is-live' : ''}" style="--pulse:${markerColor}66">
             <span style="background:${markerColor}"></span>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  })
}

function MapController({ vehicles, selectedId, markerRefs }) {
  const map = useMap()
  const fittedKey = useRef('')

  // Encuadrar todos los marcadores cuando cambia la lista de IDs.
  useEffect(() => {
    if (vehicles.length === 0) return
    const key = vehicles
      .map((v) => v.vehicle_id)
      .sort()
      .join('|')
    if (key === fittedKey.current) return
    fittedKey.current = key

    const bounds = L.latLngBounds(
      vehicles.map((v) => [v.last_lat, v.last_lng])
    )
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
  }, [vehicles, map])

  // Centrar y abrir el popup del vehículo seleccionado en la tabla.
  useEffect(() => {
    if (!selectedId) return
    const vehicle = vehicles.find((v) => v.vehicle_id === selectedId)
    if (!vehicle) return
    map.flyTo([vehicle.last_lat, vehicle.last_lng], Math.max(map.getZoom(), 14), {
      duration: 0.6,
    })
    markerRefs.current[selectedId]?.openPopup()
  }, [selectedId, vehicles, map, markerRefs])

  return null
}

/**
 * Mapa de la flota con Leaflet/OpenStreetMap.
 */
export function FleetMap({ vehicles, selectedId, onSelect }) {
  const markerRefs = useRef({})

  const icons = useMemo(() => {
    const map = {}
    for (const v of vehicles) map[v.vehicle_id] = buildIcon(v.status)
    return map
  }, [vehicles])

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {vehicles.map((vehicle) => {
        const { label } = getStatusConfig(vehicle.status)
        return (
          <Marker
            key={vehicle.vehicle_id}
            position={[vehicle.last_lat, vehicle.last_lng]}
            icon={icons[vehicle.vehicle_id]}
            ref={(instance) => {
              if (instance) markerRefs.current[vehicle.vehicle_id] = instance
              else delete markerRefs.current[vehicle.vehicle_id]
            }}
            eventHandlers={{ click: () => onSelect?.(vehicle.vehicle_id) }}
          >
            <Popup>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">{vehicle.vehicle_id}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Estado: <span className="font-medium">{label}</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Última señal: {formatClockTime(vehicle.last_seen)}
                </p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      <MapController
        vehicles={vehicles}
        selectedId={selectedId}
        markerRefs={markerRefs}
      />
    </MapContainer>
  )
}
