package routes

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"prueba-simon/src/gps/gps_infra/gps_controller"
)

// SetRoutes configura CORS, el health check y registra los controllers.
func SetRoutes(engine *gin.Engine) {
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	engine.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "gps-telemetry"})
	})

	
	apiGroup := engine.Group("/")
	gps_controller.NewGpsController(apiGroup)
}
