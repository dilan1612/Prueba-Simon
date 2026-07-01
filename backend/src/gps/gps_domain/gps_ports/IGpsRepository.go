package gps_ports

import "prueba-simon/src/gps/gps_domain/gps_structs"

type IGpsRepository interface {
	// Save persiste/actualiza la posición de un vehículo
	Save(point gps_structs.GpsPoint)

	// FindAll retorna el estado actual de todos los vehículos.
	FindAll() []gps_structs.Vehicle

	// FindByID retorna el estado de un vehículo. El booleano indica si existe.
	FindByID(vehicleID string) (gps_structs.Vehicle, bool)

	// Delete elimina un vehículo. Retorna false si no existía.
	Delete(vehicleID string) bool
}
