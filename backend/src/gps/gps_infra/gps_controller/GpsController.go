package gps_controller

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"

	"prueba-simon/src/errors"
	"prueba-simon/src/gps/gps_app"
	"prueba-simon/src/gps/gps_domain/gps_structs"
	"prueba-simon/src/gps/gps_infra/gps_repository"
)

// GpsController es el adaptador HTTP: traduce peticiones Gin a llamadas al servicio.
type GpsController struct {
	GpsService gps_app.IGpsService
}

// Singleton con sync.Once 
var (
	gpsControllerInstance *GpsController
	gpsControllerOnce     sync.Once
)

// NewGpsController construye el controller, inyecta sus dependencias
func NewGpsController(routerGroup *gin.RouterGroup) *GpsController {
	gpsControllerOnce.Do(func() {
		gpsControllerInstance = &GpsController{
			GpsService: gps_app.NewGpsService(gps_repository.NewGpsRepository()),
		}
		gpsControllerInstance.registerRoutes(routerGroup)
	})
	return gpsControllerInstance
}

func (api *GpsController) registerRoutes(routerGroup *gin.RouterGroup) {
	routerGroup.POST("/gps", api.IngestCoordinate)
	routerGroup.GET("/vehicles", api.GetVehicles)
	routerGroup.GET("/vehicles/:id", api.GetVehicleByID)
	routerGroup.DELETE("/vehicles/:id", api.DeleteVehicle)
}

// IngestCoordinate godoc
// @Summary      Ingesta de coordenada GPS
// @Description  Recibe la ubicación de un vehículo, la valida y la persiste.
// @Tags         GPS
// @Accept       json
// @Produce      json
// @Param        coordinate  body      gps_structs.GpsCoordinateRequest  true  "Coordenada GPS"
// @Success      201
// @Failure      400  {object}  errors.ErrorResponse
// @Router       /gps [post]
func (api *GpsController) IngestCoordinate(c *gin.Context) {
	var req gps_structs.GpsCoordinateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleStandardError(c, errors.NewBadRequest("El cuerpo de la petición no es un JSON válido", "INVALID_JSON"))
		return
	}

	if err := api.GpsService.IngestCoordinate(req); err != nil {
		handleStandardError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Coordenada almacenada"})
}

// GetVehicles godoc
// @Summary      Listar vehículos
// @Description  Retorna el estado actual de todos los vehículos.
// @Tags         GPS
// @Produce      json
// @Success      200  {array}  gps_structs.VehicleResponse
// @Router       /vehicles [get]
func (api *GpsController) GetVehicles(c *gin.Context) {
	c.JSON(http.StatusOK, api.GpsService.GetAllVehicles())
}

// GetVehicleByID godoc
// @Summary      Obtener vehículo por ID
// @Description  Retorna el estado de un vehículo específico.
// @Tags         GPS
// @Produce      json
// @Param        id   path      string  true  "ID del vehículo"
// @Success      200  {object}  gps_structs.VehicleResponse
// @Failure      404  {object}  errors.ErrorResponse
// @Router       /vehicles/{id} [get]
func (api *GpsController) GetVehicleByID(c *gin.Context) {
	vehicle, err := api.GpsService.GetVehicleByID(c.Param("id"))
	if err != nil {
		handleStandardError(c, err)
		return
	}
	c.JSON(http.StatusOK, vehicle)
}

// DeleteVehicle godoc
// @Summary      Eliminar vehículo
// @Description  Elimina un vehículo del sistema.
// @Tags         GPS
// @Produce      json
// @Param        id   path      string  true  "ID del vehículo"
// @Success      200
// @Failure      404  {object}  errors.ErrorResponse
// @Router       /vehicles/{id} [delete]
func (api *GpsController) DeleteVehicle(c *gin.Context) {
	if err := api.GpsService.DeleteVehicle(c.Param("id")); err != nil {
		handleStandardError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Vehículo eliminado"})
}

// handleStandardError responde con el formato estándar si el error es un HTTPError.
func handleStandardError(c *gin.Context, err error) {
	if httpErr, ok := err.(errors.HTTPError); ok {
		c.JSON(httpErr.StatusCode(), httpErr.Body())
		return
	}
	// Fallback: cualquier error no estandarizado se reporta como 500.
	internal := errors.NewInternalServerError(err.Error(), "INTERNAL_ERROR")
	c.JSON(internal.StatusCode(), internal.Body())
}
