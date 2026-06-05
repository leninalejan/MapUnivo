import { CAMPUS_ZONES } from './campusData.js'

export const MAP_WIDTH = 800
export const MAP_HEIGHT = 600
export const MAP_BOUNDS = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]]

const ROUTE_HUBS = {
  north_gate: { point: [112, 545] },
  north_connector: { point: [160, 505] },
  north_central: { point: [220, 435] },
  center_hub: { point: [305, 392] },
  west_hub: { point: [360, 170] },
  east_hub: { point: [320, 620] },
  east_spine: { point: [260, 620] },
  north_east_spine: { point: [150, 590] },
  south_hub: { point: [430, 405] },
  south_access: { point: [530, 390] },
  panamericana_gate: { point: [558, 340] },
}

const ROUTE_NODE_LABELS = {
  north_gate: 'Conexión norte',
  north_connector: 'Tramo norte',
  north_central: 'Cruce norte central',
  center_hub: 'Núcleo central',
  west_hub: 'Enlace oeste',
  east_hub: 'Enlace este',
  east_spine: 'Corredor este',
  north_east_spine: 'Bajada noreste',
  south_hub: 'Núcleo sur',
  south_access: 'Acceso sur',
  panamericana_gate: 'Portón Panamericana',
}

const HUB_EDGES = [
  ['north_gate', 'north_connector'],
  ['north_connector', 'north_central'],
  ['north_central', 'center_hub'],
  ['north_central', 'area_tres'],
  ['center_hub', 'west_hub'],
  ['center_hub', 'east_hub'],
  ['center_hub', 'south_hub'],
  ['center_hub', 'bloque_principal'],
  ['center_hub', 'administracion'],
  ['center_hub', 'bloque_modular'],
  ['west_hub', 'estacionamiento_oeste'],
  ['east_hub', 'area_dos'],
  ['east_hub', 'calle_univo'],
  ['east_hub', 'east_spine'],
  ['east_spine', 'north_east_spine'],
  ['north_east_spine', 'north_gate'],
  ['south_hub', 'modulos_sur'],
  ['south_hub', 'south_access'],
  ['south_access', 'panamericana_gate'],
  ['south_access', 'carretera_panamericana'],
  ['south_access', 'entrada_panamericana'],
  ['panamericana_gate', 'carretera_panamericana'],
  ['panamericana_gate', 'entrada_panamericana'],
  ['calle_univo', 'north_gate'],
  ['area_dos', 'east_hub'],
  ['entrada_principal', 'north_gate'],
  ['garita_norte', 'north_gate'],
]

const ZONE_LINKS = {
  entrada_principal: ['north_gate'],
  garita_norte: ['north_gate'],
  bloque_principal: ['center_hub'],
  administracion: ['center_hub'],
  bloque_modular: ['center_hub'],
  estacionamiento_oeste: ['west_hub'],
  modulos_sur: ['south_hub', 'south_access'],
  area_dos: ['east_hub'],
  area_tres: ['north_central'],
  calle_univo: ['east_spine'],
  carretera_panamericana: ['south_access', 'panamericana_gate'],
  entrada_panamericana: ['south_access', 'panamericana_gate'],
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function pointFromZone(zone) {
  return [MAP_HEIGHT * (zone.py / 100), MAP_WIDTH * (zone.px / 100)]
}

function distanceBetween(a, b) {
  const dy = a[0] - b[0]
  const dx = a[1] - b[1]
  return Math.hypot(dy, dx)
}

function buildGraph(origin, destination) {
  const nodes = {}

  CAMPUS_ZONES.forEach(zone => {
    nodes[zone.id] = {
      point: pointFromZone(zone),
      links: [...(ZONE_LINKS[zone.id] || [])],
    }
  })

  Object.entries(ROUTE_HUBS).forEach(([id, data]) => {
    nodes[id] = nodes[id] || {
      point: data.point,
      links: [],
    }
  })

  HUB_EDGES.forEach(([a, b]) => {
    if (!nodes[a]) return
    if (!nodes[b]) return
    if (!nodes[a].links.includes(b)) nodes[a].links.push(b)
    if (!nodes[b].links.includes(a)) nodes[b].links.push(a)
  })

  return nodes
}

function shortestPath(nodes, startId, endId) {
  const dist = {}
  const prev = {}
  const unvisited = new Set(Object.keys(nodes))

  Object.keys(nodes).forEach(id => {
    dist[id] = Infinity
  })
  dist[startId] = 0

  while (unvisited.size) {
    let currentId = null
    let currentDist = Infinity

    unvisited.forEach(id => {
      if (dist[id] < currentDist) {
        currentDist = dist[id]
        currentId = id
      }
    })

    if (currentId == null) break
    if (currentId === endId) break
    unvisited.delete(currentId)

    const current = nodes[currentId]
    if (!current) continue

    current.links.forEach(nextId => {
      if (!unvisited.has(nextId)) return
      const next = nodes[nextId]
      if (!next) return

      const nextDist = dist[currentId] + distanceBetween(current.point, next.point)
      if (nextDist < dist[nextId]) {
        dist[nextId] = nextDist
        prev[nextId] = currentId
      }
    })
  }

  if (!Number.isFinite(dist[endId])) {
    return null
  }

  const pathIds = []
  let cursor = endId
  while (cursor) {
    pathIds.unshift(cursor)
    if (cursor === startId) break
    cursor = prev[cursor]
  }

  if (pathIds[0] !== startId) {
    return null
  }

  return pathIds
}

function estimateRouteStats(points) {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    total += distanceBetween(points[i - 1], points[i])
  }

  const distanceMeters = Math.max(1, Math.round(total))
  const durationMinutes = Math.max(1, Math.round(distanceMeters / 75))

  return { distanceMeters, durationMinutes }
}

export function findCampusLocation(query) {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return null

  const scored = CAMPUS_ZONES
    .map(zone => {
      const fields = [
        zone.name,
        zone.id,
        zone.badge,
        zone.cat,
        zone.desc,
      ]

      const normalizedFields = fields.map(normalizeText)
      let score = 0

      if (normalizedFields.some(field => field === normalizedQuery)) {
        score = 100
      } else if (normalizedFields.some(field => field.includes(normalizedQuery))) {
        score = 60
      } else if (normalizedQuery.split(' ').every(token => normalizedFields.some(field => field.includes(token)))) {
        score = 45
      }

      return { zone, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored[0]?.zone || null
}

export function getRouteNodeLabel(id) {
  const zone = CAMPUS_ZONES.find(item => item.id === id)
  if (zone) return zone.name

  return ROUTE_NODE_LABELS[id] || String(id || '').replaceAll('_', ' ')
}

export function getRouteGuide(route) {
  if (!route?.pathIds?.length) return []

  return route.pathIds.map((id, index) => {
    const zone = CAMPUS_ZONES.find(item => item.id === id)

    return {
      id,
      index,
      label: getRouteNodeLabel(id),
      tag: zone?.badge || 'NODO',
      color: zone?.color || '#0F5EA8',
      isZone: !!zone,
      isStart: index === 0,
      isEnd: index === route.pathIds.length - 1,
    }
  })
}

export function buildCampusRoute(origin, destination) {
  if (!origin || !destination) return null
  if (origin.id === destination.id) return null

  const nodes = buildGraph(origin, destination)
  const pathIds = shortestPath(nodes, origin.id, destination.id)
  if (!pathIds) return null

  const points = pathIds.map(id => nodes[id].point)
  const { distanceMeters, durationMinutes } = estimateRouteStats(points)

  return {
    origin,
    destination,
    points,
    pathIds,
    distanceMeters,
    durationMinutes,
  }
}
