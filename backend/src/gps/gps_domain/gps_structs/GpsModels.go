package gps_structs

import "time"


type GpsPoint struct {
	VehicleID string
	Lat       float64
	Lng       float64
	Timestamp time.Time 
}

// Vehicle es la struct almacenada de un vehículo en el sistema
type Vehicle struct {
	VehicleID string
	Lat       float64
	Lng       float64
	LastSeen time.Time
	LastMovedAt time.Time
	LastTimestamp time.Time
}
