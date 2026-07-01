package gps_repository

import (
	"sync"
	"time"

	"prueba-simon/src/gps/gps_domain/gps_ports"
	"prueba-simon/src/gps/gps_domain/gps_structs"
)


type gpsRepository struct {
	mu       sync.RWMutex
	vehicles map[string]gps_structs.Vehicle
}

var (
	repositoryInstance *gpsRepository
	repositoryOnce     sync.Once
)

func NewGpsRepository() gps_ports.IGpsRepository {
	repositoryOnce.Do(func() {
		repositoryInstance = &gpsRepository{
			vehicles: make(map[string]gps_structs.Vehicle),
		}
	})
	return repositoryInstance
}

// Save persiste la coordenada y actualiza el estado derivado del vehículo.
// Tambien detecta si la coordenada cambió respecto a la última conocida p
func (r *gpsRepository) Save(point gps_structs.GpsPoint) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	existing, found := r.vehicles[point.VehicleID]

	lastMovedAt := now
	if found && existing.Lat == point.Lat && existing.Lng == point.Lng {
		lastMovedAt = existing.LastMovedAt
	}

	r.vehicles[point.VehicleID] = gps_structs.Vehicle{
		VehicleID:     point.VehicleID,
		Lat:           point.Lat,
		Lng:           point.Lng,
		LastSeen:      now,
		LastMovedAt:   lastMovedAt,
		LastTimestamp: point.Timestamp,
	}
}

func (r *gpsRepository) FindAll() []gps_structs.Vehicle {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]gps_structs.Vehicle, 0, len(r.vehicles))
	for _, v := range r.vehicles {
		result = append(result, v)
	}
	return result
}

func (r *gpsRepository) FindByID(vehicleID string) (gps_structs.Vehicle, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	v, found := r.vehicles[vehicleID]
	return v, found
}

func (r *gpsRepository) Delete(vehicleID string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, found := r.vehicles[vehicleID]; !found {
		return false
	}
	delete(r.vehicles, vehicleID)
	return true
}
