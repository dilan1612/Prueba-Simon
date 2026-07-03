# Prueba Técnica — Telemetría de Flotas GPS

Sistema de monitoreo de flotas GPS compuesto por un backend REST en Go, un dashboard web en React y un simulador de vehículos en Node.js.

---

## Cómo correr el proyecto localmente

Se necesitan tres terminales abiertas en paralelo.

### 1. Backend (requiere Go ≥ 1.21)

```bash
cd backend && go run main.go
```

Queda escuchando en `http://localhost:8080`.

### 2. Frontend (requiere Node.js ≥ 18)

```bash
cd frontend/prueba-simon-frontend && npm install && npm run dev
```

Abre `http://localhost:5173` en el navegador.

### 3. Simulador

```bash
cd simulator && node simulator.js
```

Arranca 4 vehículos virtuales enviando coordenadas GPS al backend cada 3–5 segundos.

---

## Arquitectura

### Estructura general

```text
backend/    → API REST en Go + Gin
frontend/   → SPA en React + Vite
simulator/  → Script Node.js que simula vehículos reales
```

Cada pieza tiene una única responsabilidad y se puede correr y probar de forma independiente.

### Backend — Arquitectura hexagonal

```text
backend/src/gps/
├── gps_domain/   → structs, interfaces (puertos), constantes de estado
├── gps_app/      → GpsService (lógica de negocio pura)
└── gps_infra/    → GpsController (adaptador HTTP) + GpsRepository (almacenamiento)
```

El dominio y el servicio no dependen de ningún detalle de infraestructura. El repositorio está detrás de la interfaz `IGpsRepository`, por lo que reemplazarlo por una base de datos real no requiere tocar la lógica de negocio.

**Por qué esta arquitectura:** permite aislar y testear la lógica de estados (`En movimiento`, `Detenido`, `Sin señal`) sin levantar HTTP ni base de datos. El estado se calcula al momento de consultar —no se persiste— para que siempre refleje el tiempo real transcurrido y evitar inconsistencias.

**Almacenamiento:** mapa en memoria protegido por un `sync.RWMutex`. Suficiente para un prototipo; al estar desacoplado por interfaz, la migración a PostgreSQL o Redis no rompe nada más allá del repositorio.

### Frontend

SPA en React con polling cada 5 segundos a `GET /vehicles`. Más simple y tolerante a fallos que WebSockets para este caso: si una petición falla, el panel conserva los últimos datos y muestra un aviso sin parpadear. Mapa con Leaflet + OpenStreetMap (sin API key). Componentes estilo shadcn sobre Tailwind, con modo claro/oscuro.

---

## Reflexión — Eliminación de vehículos (sección 03.1 D)

> ¿Qué consideraciones adicionales tendría si hubiera caché (Redis) y base de datos persistente?

Con almacenamiento en memoria la operación es atómica y trivial. Con Redis + base de datos aparecen dos riesgos:

1. **Dato fantasma en caché.** Si se borra el registro de la base de datos pero la entrada de Redis todavía no expiró, las consultas siguientes devolverán un vehículo que ya no existe. La solución es invalidar la caché **antes** de confirmar el borrado en la base, o dentro de la misma transacción lógica (si el sistema lo permite).

2. **Fallo parcial entre ambos stores.** Si el DELETE en la base tiene éxito pero la llamada a Redis falla (o viceversa), el sistema queda en estado inconsistente. Se puede mitigar con un patrón *delete-then-invalidate* con reintento en el paso de caché, o con un bus de eventos que propague el borrado de forma asíncrona y garantice consistencia eventual.

En resumen: hay que definir el orden de operaciones (base primero, caché después), manejar el fallo del paso de caché sin dejar huérfanos, y opcionalmente emitir un evento `vehicle.deleted` para que otros consumidores (logs, analytics) puedan reaccionar.

---

## Reporte de IA

### Herramientas utilizadas

- **Claude (Anthropic)** — asistente principal durante el desarrollo.

### Tareas en las que se usó IA

| Área | Uso |
| --- | --- |
| Frontend | Consulta sobre la API de Leaflet (cómo centrar el mapa y abrir popups programáticamente). |
| Simulador | Referencia sobre cómo estructurar envíos paralelos en Node.js con `Promise.all` y `setInterval`. |
| Backend | Consulta puntual sobre sintaxis uso de memeoria en Go (mutex, sync.RWMutex). |

### Error corregido

El simulador generaba el vehículo estático (VH-001) con un pequeño delta aleatorio igual que los demás, por lo que el backend nunca lo marcaba como `Detenido`. Corregí la lógica para que VH-001 siempre reenvíe exactamente la misma coordenada; de esa forma, pasado el `movingWindow` de 60 segundos, el servicio lo detecta correctamente como detenido. El cambio fue identificado y aplicado manualmente tras revisar la lógica de `computeStatus` en [GpsService.go](backend/src/gps/gps_app/GpsService.go).
