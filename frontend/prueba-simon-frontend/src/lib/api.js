
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'


export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    // Falla de red / backend caído: fetch lanza TypeError sin status.
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  if (!response.ok) {
    const message = await extractErrorMessage(response)
    throw new ApiError(message, response.status)
  }

  // 204 o cuerpo vacío: no intentamos parsear JSON.
  if (response.status === 204) return null
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

async function extractErrorMessage(response) {
  try {
    const body = await response.json()
    return body?.message ?? `Error ${response.status}`
  } catch {
    return `Error ${response.status}`
  }
}

/** GET /vehicles → estado actual de toda la flota. */
export function getVehicles() {
  return request('/vehicles')
}

/**
 * registra una nueva coordenada para un vehículo.
 */
export function postGpsCoordinate(payload) {
  return request('/gps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/** elimina un vehículo del sistema. */
export function deleteVehicle(vehicleId) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}`, {
    method: 'DELETE',
  })
}

export { API_URL }
