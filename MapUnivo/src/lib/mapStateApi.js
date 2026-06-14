const MAP_STATE_PATH = '/api/map-state'

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(body || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function loadMapState() {
  return requestJson(MAP_STATE_PATH, {
    method: 'GET',
  })
}

export async function saveMapState(state) {
  return requestJson(MAP_STATE_PATH, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  })
}
