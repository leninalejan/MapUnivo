import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LAYER_CONFIG } from '../data/campusData.js'
import { MAP_WIDTH, MAP_HEIGHT, MAP_BOUNDS, pointFromZone } from '../data/campusRoutes.js'
import { Icons } from './Icons.jsx'
import styles from './CampusMap.module.css'
import baseMapUrl from '../assets/base-map.svg'

const FIT_PADDING = [24, 24]
const BASE_MAP_URL = baseMapUrl

function getSafeZoom(map, fallback = 0) {
  const zoom = map?.getZoom?.()
  return Number.isFinite(zoom) ? zoom : fallback
}

export default function CampusMap({ zones, layers, activeZone, onZoneClick, onToggleLayer = () => {}, route = null, routeSummary = null }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const baseLayerRef = useRef(null)
  const markerRefs = useRef({})
  const routeLayerRef = useRef(null)
  const onZoneClickRef = useRef(onZoneClick)
  const [baseReady, setBaseReady] = useState(false)

  useEffect(() => {
    onZoneClickRef.current = onZoneClick
  }, [onZoneClick])

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return
    setBaseReady(false)
    let alive = true

    const map = L.map(mapNodeRef.current, {
      crs: L.CRS.Simple,
      zoomControl: false,
      attributionControl: false,
      minZoom: -1,
      maxZoom: 5,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      preferCanvas: true,
      inertia: true,
    })

    mapRef.current = map
    map.setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], 0, { animate: false })

    const basePane = map.createPane('campus-base')
    basePane.style.zIndex = '200'

    const markerPane = map.createPane('campus-markers')
    markerPane.style.zIndex = '650'

    const routePane = map.createPane('campus-route')
    routePane.style.zIndex = '550'

    const baseLayer = L.imageOverlay(BASE_MAP_URL, MAP_BOUNDS, {
      pane: 'campus-base',
      interactive: false,
    })
    baseLayer.on('load', () => {
      if (alive) setBaseReady(true)
    })
    baseLayer.on('error', () => {
      if (alive) setBaseReady(true)
    })
    baseLayer.addTo(map)
    baseLayerRef.current = baseLayer

    const readyTimer = window.setTimeout(() => {
      if (alive) setBaseReady(true)
    }, 80)

    zones.forEach(zone => {
      const marker = L.circleMarker(pointFromZone(zone), {
        pane: 'campus-markers',
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: zone.color,
        fillOpacity: 1,
        opacity: 1,
      })

      marker.bindTooltip(zone.name, {
        permanent: true,
        direction: 'right',
        offset: [10, 0],
        className: styles.zoneTooltip,
        opacity: 1,
        sticky: false,
      })

      marker.on('click', () => {
        onZoneClickRef.current(zone)
      })

      markerRefs.current[zone.id] = marker
    })

    const fitCampus = () => {
      map.invalidateSize()
      const size = map.getSize()
      if (!size.x || !size.y) {
        map.setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], 0, { animate: false })
        return
      }

      try {
        map.fitBounds(MAP_BOUNDS, { padding: FIT_PADDING, animate: false })
      } catch {
        map.setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], 0, { animate: false })
      }
    }

    const rafId = window.requestAnimationFrame(fitCampus)
    const handleResize = () => {
      map.invalidateSize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      alive = false
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(readyTimer)
      baseLayerRef.current?.remove()
      baseLayerRef.current = null
      routeLayerRef.current?.remove()
      routeLayerRef.current = null
      map.remove()
      markerRefs.current = {}
      mapRef.current = null
    }
  }, [zones])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    zones.forEach(zone => {
      const marker = markerRefs.current[zone.id]
      if (!marker) return

      const visible = !!layers[zone.cat]
      const isActive = activeZone?.id === zone.id

      if (visible) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map)
        }

        marker.setStyle({
          radius: isActive ? 9 : 6,
          weight: isActive ? 3 : 2,
          color: isActive ? zone.color : '#ffffff',
          fillColor: zone.color,
          fillOpacity: 1,
        })

        if (isActive) {
          marker.bringToFront()
        }
      } else if (map.hasLayer(marker)) {
        marker.remove()
      }
    })

    if (!route && activeZone && layers[activeZone.cat]) {
      const point = pointFromZone(activeZone)
      const nextZoom = Math.min(4.25, Math.max(getSafeZoom(map, 2.8), 2.8))
      map.setView(point, nextZoom, { animate: true })
    }
  }, [zones, layers, activeZone, route])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    routeLayerRef.current?.remove()
    routeLayerRef.current = null

    if (!route?.points?.length) {
      if (!activeZone) {
        try {
          map.fitBounds(MAP_BOUNDS, { padding: FIT_PADDING, animate: false })
        } catch {
          map.setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], -0.25, { animate: false })
        }
      }
      return
    }

    const routeGroup = L.layerGroup()
    const baseLine = L.polyline(route.points, {
      pane: 'campus-route',
      color: '#0f5ea8',
      weight: 10,
      opacity: 0.36,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    })
    const routeLine = L.polyline(route.points, {
      pane: 'campus-route',
      color: '#f2b544',
      weight: 5,
      opacity: 0.98,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    })
    const startMarker = L.circleMarker(route.points[0], {
      pane: 'campus-route',
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#1c9c72',
      fillOpacity: 1,
      opacity: 1,
      interactive: false,
    })
    const endMarker = L.circleMarker(route.points[route.points.length - 1], {
      pane: 'campus-route',
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#d44d4d',
      fillOpacity: 1,
      opacity: 1,
      interactive: false,
    })

    routeGroup.addLayer(baseLine)
    routeGroup.addLayer(routeLine)
    routeGroup.addLayer(startMarker)
    routeGroup.addLayer(endMarker)
    routeGroup.addTo(map)
    routeLayerRef.current = routeGroup

    const routeCenter = route.points.reduce(
      (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
      [0, 0]
    ).map(total => total / route.points.length)

    map.setView(routeCenter, Math.min(4.5, Math.max(getSafeZoom(map, 2.8), 2.8)), {
      animate: true,
    })
  }, [route])

  const handleZoomIn = (e) => {
    e.stopPropagation()
    mapRef.current?.zoomIn()
  }

  const handleZoomOut = (e) => {
    e.stopPropagation()
    mapRef.current?.zoomOut()
  }

  const handleReset = (e) => {
    e.stopPropagation()
    mapRef.current?.fitBounds(MAP_BOUNDS, { padding: FIT_PADDING, animate: true })
  }

  const handleFocusActive = (e) => {
    e.stopPropagation()

    const map = mapRef.current
    if (!map) return

    if (activeZone && layers[activeZone.cat]) {
      const point = pointFromZone(activeZone)
      const nextZoom = Math.min(4.25, Math.max(getSafeZoom(map, 2.8), 2.8))
      map.setView(point, nextZoom, { animate: true })
      return
    }

    if (routeSummary?.points?.length) {
      const routeCenter = routeSummary.points.reduce(
        (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
        [0, 0]
      ).map(total => total / routeSummary.points.length)

      map.setView(routeCenter, Math.min(4.5, Math.max(getSafeZoom(map, 2.8), 2.8)), {
        animate: true,
      })
      return
    }

    map.fitBounds(MAP_BOUNDS, { padding: FIT_PADDING, animate: true })
  }

  const handleFocusRoute = (e) => {
    e.stopPropagation()

    const map = mapRef.current
    if (!map || !routeSummary?.points?.length) return

    const routeCenter = routeSummary.points.reduce(
      (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
      [0, 0]
    ).map(total => total / routeSummary.points.length)

    map.setView(routeCenter, Math.min(4.5, Math.max(getSafeZoom(map, 2.8), 2.8)), {
      animate: true,
    })
  }

  return (
    <div className={styles.mapArea}>
      <div
        ref={mapNodeRef}
        className={styles.leafletViewport}
        aria-label="Mapa topografico UNIVO"
      />

      {!baseReady && (
        <div className={styles.mapOverlayLoading} aria-live="polite" aria-busy="true">
          <div className={styles.mapOverlayCard}>
            <div className={styles.mapOverlaySpinner} />
            <div className={styles.mapOverlayTitle}>Cargando mapa UNIVO</div>
            <div className={styles.mapOverlayText}>
              Preparando el plano base y las capas del campus...
            </div>
          </div>
        </div>
      )}

      <div className={styles.planBadge}>
        Plano UNIVO actualizado - Leaflet base
      </div>

      {routeSummary && (
        <div className={styles.navigationCard}>
          <div className={styles.navigationCardHeader}>
            <span className={styles.navigationPill}>Modo navegacion</span>
            <button
              className={styles.navigationButton}
              onClick={handleFocusRoute}
              title="Centrar ruta"
              aria-label="Centrar ruta"
            >
              <Icons.Route />
            </button>
          </div>
          <div className={styles.navigationTitle}>
            {routeSummary.origin.name} {'\u2192'} {routeSummary.destination.name}
          </div>
          <div className={styles.navigationMeta}>
            <span>{routeSummary.distanceMeters} m aprox.</span>
            <span>{routeSummary.durationMinutes} min aprox.</span>
            <span>{routeSummary.stepCount} nodos</span>
          </div>
          <div className={styles.navigationNext}>
            {routeSummary.nextStop
              ? `Siguiente: ${routeSummary.nextStop.label}`
              : 'Ruta lista para seguir'}
          </div>
        </div>
      )}

      <div className={styles.controls} onClick={e => e.stopPropagation()}>
        <button
          className={styles.ctrlBtn}
          onClick={handleZoomIn}
          title="Acercar"
          aria-label="Acercar"
        >
          <Icons.Plus />
        </button>
        <button
          className={styles.ctrlBtn}
          onClick={handleZoomOut}
          title="Alejar"
          aria-label="Alejar"
        >
          <Icons.Minus />
        </button>
        <div className={styles.ctrlDivider} />
        <button
          className={styles.ctrlBtn}
          onClick={handleReset}
          title="Vista general"
          aria-label="Vista general"
        >
          <Icons.Reset />
        </button>
        <button
          className={styles.ctrlBtn}
          onClick={handleFocusActive}
          title={activeZone ? `Centrar ${activeZone.name}` : 'Centrar mapa'}
          aria-label="Centrar mapa"
          disabled={!activeZone && !routeSummary}
        >
          <Icons.Pin />
        </button>
      </div>

      <div className={styles.legendBar} onClick={e => e.stopPropagation()}>
        {LAYER_CONFIG.map(layer => {
          const active = !!layers[layer.id]
          return (
            <button
              key={layer.id}
              className={`${styles.legendChip} ${active ? styles.legendChipOn : ''}`}
              onClick={() => onToggleLayer(layer.id)}
              title={active ? 'Ocultar capa' : 'Mostrar capa'}
            >
              <span className={styles.legendDot} style={{ background: layer.color }} />
              {layer.label}
            </button>
          )
        })}
      </div>

      <div className={styles.scaleBar}>
        <span className={styles.scaleLabel}>~100 m</span>
        <span className={styles.scaleLine} />
      </div>

      <div className={styles.mapNote}>
        Base vectorial desde CAD (1).pdf
      </div>
    </div>
  )
}
