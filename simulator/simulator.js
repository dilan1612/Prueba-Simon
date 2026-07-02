/**
 * Simulador de Telemetría de Flotas GPS
 * Script independiente que simula varios vehículos enviando coordenadas al
 * backend (POST /gps)
 */

const API_URL = process.env.API_URL ?? 'http://localhost:8080'
const VEHICLE_COUNT = Math.max(3, Number(process.env.VEHICLE_COUNT ?? 4))
const MIN_INTERVAL_MS = Number(process.env.MIN_INTERVAL_MS ?? 3000)
const MAX_INTERVAL_MS = Number(process.env.MAX_INTERVAL_MS ?? 5000)
const ERROR_RATE = Number(process.env.ERROR_RATE ?? 0.1) 

// Área de Bogotá 
const BOGOTA = { minLat: 4.6, maxLat: 4.75, minLng: -74.2, maxLng: -73.95 }
const MOVE_DELTA = 0.0012 

// ── Utilidades numéricas ────────────────────────────────────────────────────
const randomInRange = (min, max) => min + Math.random() * (max - min)
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ── Estado de la simulación ─────────────────────────────────────────────────
const stats = { sent: 0, valid: 0, invalid: 0, ok: 0, rejected: 0, failed: 0 }
const timers = []
let running = true


function createFleet() {
  return Array.from({ length: VEHICLE_COUNT }, (_, i) => ({
    id: `VH-${String(i + 1).padStart(3, '0')}`,
    lat: randomInRange(BOGOTA.minLat, BOGOTA.maxLat),
    lng: randomInRange(BOGOTA.minLng, BOGOTA.maxLng),
    stationary: i === 0,
  }))
}

/** Avanza la posición del vehículo con un delta aleatorio, dentro del área. */
function moveVehicle(vehicle) {
  if (vehicle.stationary) return 
  vehicle.lat = clamp(
    vehicle.lat + randomInRange(-MOVE_DELTA, MOVE_DELTA),
    BOGOTA.minLat,
    BOGOTA.maxLat
  )
  vehicle.lng = clamp(
    vehicle.lng + randomInRange(-MOVE_DELTA, MOVE_DELTA),
    BOGOTA.minLng,
    BOGOTA.maxLng
  )
}

/** Payload válido a partir del estado actual del vehículo. */
function buildValidPayload(vehicle) {
  return {
    vehicle_id: vehicle.id,
    lat: Number(vehicle.lat.toFixed(6)),
    lng: Number(vehicle.lng.toFixed(6)),
    timestamp: new Date().toISOString(),
  }
}

function buildInvalidPayload(vehicle) {
  const base = buildValidPayload(vehicle)
  const corruption = pick([
    () => ({ payload: omit(base, 'vehicle_id'), kind: 'sin vehicle_id' }),
    () => ({ payload: { ...base, vehicle_id: '' }, kind: 'vehicle_id vacío' }),
    () => ({ payload: omit(base, 'lat'), kind: 'sin lat' }),
    () => ({ payload: { ...base, lat: 120 }, kind: 'lat fuera de rango' }),
    () => ({ payload: { ...base, lng: -200 }, kind: 'lng fuera de rango' }),
    () => ({ payload: { ...base, lat: 'abc' }, kind: 'lat no numérica' }),
    () => ({ payload: omit(base, 'timestamp'), kind: 'sin timestamp' }),
    () => ({ payload: { ...base, timestamp: '01-06-2025' }, kind: 'timestamp inválido' }),
  ])
  return corruption()
}


function omit(obj, key) {
  const copy = { ...obj }
  delete copy[key]
  return copy
}


async function sendCoordinate(vehicle) {
  const corrupt = Math.random() < ERROR_RATE

  let payload
  let kind = 'válido'
  if (corrupt) {
    const invalid = buildInvalidPayload(vehicle)
    payload = invalid.payload
    kind = invalid.kind
    stats.invalid += 1
  } else {
    moveVehicle(vehicle)
    payload = buildValidPayload(vehicle)
    stats.valid += 1
  }
  stats.sent += 1

  try {
    const res = await fetch(`${API_URL}/gps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.status === 201) {
      stats.ok += 1
      log('ok', `${vehicle.id}  201  posición registrada`)
    } else if (res.status === 400) {
      stats.rejected += 1
      const body = await res.json().catch(() => ({}))
      log('warn', `${vehicle.id}  400  rechazado (${kind}): ${body.message ?? ''}`)
    } else {
      stats.failed += 1
      log('err', `${vehicle.id}  ${res.status}  respuesta inesperada`)
    }
  } catch {
    stats.failed += 1
    log('err', `${vehicle.id}  ---  no se pudo conectar con ${API_URL}`)
  }
}

/** Programa el próximo envío del vehículo con un intervalo aleatorio 3–5 s. */
function scheduleNext(vehicle) {
  if (!running) return
  const delay = randomInRange(MIN_INTERVAL_MS, MAX_INTERVAL_MS)
  const timer = setTimeout(async () => {
    await sendCoordinate(vehicle)
    scheduleNext(vehicle)
  }, delay)
  timers.push(timer)
}

const COLORS = { ok: '\x1b[32m', warn: '\x1b[33m', err: '\x1b[31m', dim: '\x1b[2m', reset: '\x1b[0m' }
function log(level, message) {
  const time = new Date().toLocaleTimeString('es-CO')
  const color = COLORS[level] ?? ''
  console.log(`${COLORS.dim}${time}${COLORS.reset} ${color}${message}${COLORS.reset}`)
}

/** Imprime un resumen acumulado al cerrar. */
function printSummary() {
  console.log(`\n${COLORS.dim}── Resumen de la simulación ──${COLORS.reset}`)
  console.log(`Requests enviados : ${stats.sent}`)
  console.log(`  válidos         : ${stats.valid}`)
  console.log(`  inválidos       : ${stats.invalid} (${percent(stats.invalid, stats.sent)})`)
  console.log(`Respuestas 201    : ${stats.ok}`)
  console.log(`Respuestas 400    : ${stats.rejected}`)
  console.log(`Fallos de red/otro: ${stats.failed}`)
}

const percent = (part, total) =>
  total === 0 ? '0%' : `${((part / total) * 100).toFixed(1)}%`

// ── Arranque ─────────────────────────────────────────────────────────────────
function main() {
  const fleet = createFleet()

  console.log(`${COLORS.dim}Simulador de telemetría GPS${COLORS.reset}`)
  console.log(`API destino     : ${API_URL}`)
  console.log(`Vehículos       : ${fleet.map((v) => v.id).join(', ')}`)
  console.log(`Estático        : ${fleet.find((v) => v.stationary).id} (quedará "Detenido")`)
  console.log(`Intervalo envío : ${MIN_INTERVAL_MS / 1000}–${MAX_INTERVAL_MS / 1000} s por vehículo`)
  console.log(`Tasa de error   : ~${(ERROR_RATE * 100).toFixed(0)}%`)
  console.log(`${COLORS.dim}Presiona Ctrl+C para detener.${COLORS.reset}\n`)

  fleet.forEach(scheduleNext)
}

// Apagado ordenado: detiene los timers y muestra el resumen.
process.on('SIGINT', () => {
  running = false
  timers.forEach(clearTimeout)
  printSummary()
  process.exit(0)
})

main()
