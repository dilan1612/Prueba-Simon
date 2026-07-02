# Simulador de Telemetría GPS

Script independiente en Node.js que simula una flota de vehículos enviando
coordenadas al backend (`POST /gps`).

## Cómo correrlo

Con el backend corriendo en `http://localhost:8080`:

```bash
node simulator.js
```

(o `npm start`). No requiere `npm install`: usa el `fetch` nativo de Node 18+.
Se detiene con `Ctrl+C` e imprime un resumen.

## Qué hace

- Simula **4 vehículos** (`VH-001` … `VH-004`) enviando datos en paralelo.
- Cada vehículo envía una coordenada cada **3–5 s** (intervalo aleatorio).
- **`VH-001` permanece estático**: reenvía siempre la misma coordenada, así que
  el backend lo reportará como **"Detenido"** pasado 1 minuto.
- El resto se mueve dentro del área de **Bogotá** (lat 4.60–4.75 / lng -74.20 a
  -73.95) con deltas aleatorios pequeños (~130 m por iteración).
- **~10%** de los requests se corrompen a propósito (campo faltante, `lat`/`lng`
  fuera de rango, tipo inválido, `timestamp` mal formado…) para ejercitar las
  validaciones y provocar respuestas `400`.

## Configuración (variables de entorno)

| Variable          | Default                  | Descripción                          |
|-------------------|--------------------------|--------------------------------------|
| `API_URL`         | `http://localhost:8080`  | URL base del backend                 |
| `VEHICLE_COUNT`   | `4`                      | Nº de vehículos (mínimo 3)           |
| `MIN_INTERVAL_MS` | `3000`                   | Intervalo mínimo de envío            |
| `MAX_INTERVAL_MS` | `5000`                   | Intervalo máximo de envío            |
| `ERROR_RATE`      | `0.1`                    | Proporción de requests inválidos     |

Ejemplo:

```bash
VEHICLE_COUNT=6 ERROR_RATE=0.2 node simulator.js
```
