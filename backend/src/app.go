package src

import (
	"os"

	"github.com/gin-gonic/gin"

	"prueba-simon/src/common/routes"
	"prueba-simon/src/common/utils"
)

func Run(isLocal bool) {
	logger := utils.NewLogger()

	if isLocal {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.Default()
	routes.SetRoutes(engine)

	address := serverAddress()
	logger.Info("Servidor GPS escuchando en " + address)
	if err := engine.Run(address); err != nil {
		logger.Fatal("No se pudo iniciar el servidor: " + err.Error())
	}
}

func serverAddress() string {
	if addr := os.Getenv("GPS_SERVER_ADDRESS"); addr != "" {
		return addr
	}
	return ":8080"
}
