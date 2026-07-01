package gps_app

import (
	"strings"
	"time"

	"prueba-simon/src/errors"
	"prueba-simon/src/gps/gps_domain/gps_ports"
	"prueba-simon/src/gps/gps_domain/gps_structs"
)

const (
	movingWindow   = 60 * time.Second // coordenada distinta en los últimos 60s
	noSignalWindow = 2 * time.Minute  // sin datos por más de 2 minutos
)

type IGpsService interface {
	IngestCoordinate(req gps_structs.GpsCoordinateRequest) error
	GetAllVehicles() []gps_structs.VehicleResponse
	GetVehicleByID(vehicleID string) (*gps_structs.VehicleResponse, error)
	DeleteVehicle(vehicleID string) error
}

type gpsService struct {
	repository gps_ports.IGpsRepository
}

func NewGpsService(repository gps_ports.IGpsRepository) IGpsService {
	return &gpsService{repository: repository}
}

// IngestCoordinate valida el request y persiste la nueva coordenada.
func (s *gpsService) IngestCoordinate(req gps_structs.GpsCoordinateRequest) error {
	point, err := validateCoordinate(req)
	if err != nil {
		return err
	}
	s.repository.Save(point)
	return nil
}

// GetAllVehicles retorna el estado actual de todos los vehículos.
func (s *gpsService) GetAllVehicles() []gps_structs.VehicleResponse {
	now := time.Now()
	vehicles := s.repository.FindAll()

	responses := make([]gps_structs.VehicleResponse, 0, len(vehicles))
	for _, v := range vehicles {
		responses = append(responses, toResponse(v, now))
	}
	return responses
}

// GetVehicleByID retorna un vehículo o un HTTPError 404 si no existe.
func (s *gpsService) GetVehicleByID(vehicleID string) (*gps_structs.VehicleResponse, error) {
	vehicle, found := s.repository.FindByID(vehicleID)
	if !found {
		return nil, errors.NewNotFound("Vehículo no encontrado", "VEHICLE_NOT_FOUND")
	}
	response := toResponse(vehicle, time.Now())
	return &response, nil
}

// DeleteVehicle elimina un vehículo o retorna 404 si no existe.
func (s *gpsService) DeleteVehicle(vehicleID string) error {
	if deleted := s.repository.Delete(vehicleID); !deleted {
		return errors.NewNotFound("Vehículo no encontrado", "VEHICLE_NOT_FOUND")
	}
	return nil
}

// validateCoordinate aplica las validaciones mínimas requeridas y devuelve
func validateCoordinate(req gps_structs.GpsCoordinateRequest) (gps_structs.GpsPoint, error) {
	if strings.TrimSpace(req.VehicleID) == "" {
		return gps_structs.GpsPoint{}, errors.NewBadRequest("El campo 'vehicle_id' es obligatorio y no puede estar vacío", "INVALID_VEHICLE_ID")
	}
	if req.Lat == nil {
		return gps_structs.GpsPoint{}, errors.NewBadRequest("El campo 'lat' es obligatorio", "MISSING_LAT")
	}
	if *req.Lat < -90 || *req.Lat > 90 {
		return gps_structs.GpsPoint{}, errors.NewBadRequest("El campo 'lat' debe estar en el rango -90 a 90", "INVALID_LAT")
	}
	if req.Lng == nil {
		return gps_structs.GpsPoint{}, errors.NewBadRequest("El campo 'lng' es obligatorio", "MISSING_LNG")
	}
	if *req.Lng < -180 || *req.Lng > 180 {
		return gps_structs.GpsPoint{}, errors.NewBadRequest("El campo 'lng' debe estar en el rango -180 a 180", "INVALID_LNG")
	}
	if strings.TrimSpace(req.Timestamp) == "" {
		return gps_structs.GpsPoint{}, errors.NewBadRequest("El campo 'timestamp' es obligatorio", "MISSING_TIMESTAMP")
	}
	parsedTime, parseErr := time.Parse(time.RFC3339, req.Timestamp)
	if parseErr != nil {
		return gps_structs.GpsPoint{}, errors.NewBadRequest("El campo 'timestamp' debe tener formato ISO 8601 (ej: 2025-06-01T10:00:00Z)", "INVALID_TIMESTAMP")
	}

	return gps_structs.GpsPoint{
		VehicleID: req.VehicleID,
		Lat:       *req.Lat,
		Lng:       *req.Lng,
		Timestamp: parsedTime,
	}, nil
}

// Calucula el estado del vehículo en función del tiempo transcurrido.
func toResponse(v gps_structs.Vehicle, now time.Time) gps_structs.VehicleResponse {
	return gps_structs.VehicleResponse{
		VehicleID: v.VehicleID,
		LastLat:   v.Lat,
		LastLng:   v.Lng,
		LastSeen:  v.LastSeen.UTC().Format(time.RFC3339),
		Status:    computeStatus(v, now),
	}
}

// computeStatus aplica la lógica de estados:
//   - Sin señal:     no se reciben datos hace más de 2 minutos.
//   - En movimiento: la coordenada cambió en los últimos 60 segundos.
//   - Detenido:      hay señal, pero la coordenada no cambia hace más de 1 minuto.
func computeStatus(v gps_structs.Vehicle, now time.Time) string {
	if now.Sub(v.LastSeen) > noSignalWindow {
		return gps_structs.StatusNoSignal
	}
	if now.Sub(v.LastMovedAt) <= movingWindow {
		return gps_structs.StatusMoving
	}
	return gps_structs.StatusStopped
}
