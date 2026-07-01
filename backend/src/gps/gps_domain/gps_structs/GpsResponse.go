package gps_structs

const (
	StatusMoving   = "En movimiento"
	StatusStopped  = "Detenido"
	StatusNoSignal = "Sin señal"
)

type VehicleResponse struct {
	VehicleID string  `json:"vehicle_id"`
	LastLat   float64 `json:"last_lat"`
	LastLng   float64 `json:"last_lng"`
	LastSeen  string  `json:"last_seen"`
	Status    string  `json:"status"`
}
