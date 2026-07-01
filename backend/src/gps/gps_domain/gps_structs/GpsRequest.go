package gps_structs

type GpsCoordinateRequest struct {
	VehicleID string   `json:"vehicle_id"`
	Lat       *float64 `json:"lat"`
	Lng       *float64 `json:"lng"`
	Timestamp string   `json:"timestamp"`
}
