package main

import (
	"flag"

	"prueba-simon/src"
)

// @title           API de Telemetría de Flotas GPS
// @version         1.0
// @description     Backend para ingesta de coordenadas GPS y monitoreo de estado de vehículos en tiempo real.
func main() {

	isLocal := flag.Bool("local", false, "Ejecuta el servidor en modo local")
	flag.Parse()

	src.Run(*isLocal)
}
