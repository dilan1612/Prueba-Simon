# Panel de Telemetría de Flotas GPS — Frontend

SPA que consume la API de telemetría y muestra el estado de la flota en tiempo
real: tabla de vehículos, mapa con Leaflet y refresco automático cada 5 s.

## Cómo correrlo

```bash
npm install
npm run dev
```

Por defecto consume el backend en `http://localhost:8080`. Si tu API corre en
otra dirección, edita la variable `VITE_API_URL` en el archivo `.env`.

## Stack y arquitectura

- **React 19 + Vite** — SPA ligera y arranque rápido.
- **Tailwind CSS v4 + componentes estilo shadcn/ui** (`src/components/ui`) —
  primitivas accesibles (Button, Card, Badge, Table) construidas a mano sobre
  tokens de diseño en `src/index.css`, con modo claro/oscuro.
- **Leaflet + react-leaflet** — mapa con OpenStreetMap (sin API key).
- **lucide-react** — íconos.

Organización:

```
src/
├─ components/
│  ├─ ui/                 # primitivas shadcn (button, card, badge, table, skeleton)
│  ├─ DashboardHeader.jsx # marca, estado "en vivo", última actualización, tema
│  ├─ FleetStats.jsx      # tarjetas-resumen (total + conteo por estado)
│  ├─ FleetMap.jsx        # mapa Leaflet con marcadores por estado
│  ├─ StatusBadge.jsx     # indicador visual del estado
│  └─ VehicleTable.jsx    # tabla con acción de eliminar
├─ hooks/
│  ├─ useVehicles.js      # polling a GET /vehicles cada 5 s + última actualización
│  ├─ useNow.js           # tick para mantener vivos los textos relativos
│  └─ useTheme.js         # modo claro/oscuro persistente
└─ lib/
   ├─ api.js              # cliente HTTP (ApiError, getVehicles, deleteVehicle)
   ├─ status.js           # mapeo estado → color/ícono/marcador
   ├─ time.js             # "hace 3 segundos", hora local
   └─ utils.js            # helper cn() de shadcn
```

## Decisiones

- **Datos reales, no mock.** El mapa pinta la última posición real devuelta por
  `GET /vehicles`; no se usó data estática.
- **Polling cada 5 s** (según el enunciado). El hook conserva los últimos datos
  válidos aunque una petición falle, así el panel no parpadea; un banner avisa
  si se pierde la conexión con el backend.
- **Estados con color e ícono:** verde = En movimiento, ámbar = Detenido,
  rojo = Sin señal. La misma paleta se reutiliza en badges y marcadores.
- **Tabla ↔ mapa sincronizados:** seleccionar una fila centra el mapa y abre el
  popup del vehículo, y viceversa.
- Se incluye el botón de eliminar (`DELETE /vehicles/:id`) para ejercitar ese
  endpoint desde la UI.
