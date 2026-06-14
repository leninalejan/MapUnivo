import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { renderToStaticMarkup } from 'react-dom/server'
import { LAYER_CONFIG } from '../data/campusData.js'
import { MAP_WIDTH, MAP_HEIGHT, MAP_BOUNDS, pointFromZone } from '../data/campusRoutes.js'
import { Icons } from './Icons.jsx'
import styles from './CampusMap.module.css'
import baseMapUrl from '../assets/base-map-standard.png'
import baseMapDarkUrl from '../assets/base-map-standard-dark.png'
import satelliteMapDarkUrl from '../assets/campus-satellite-dark.png'
import satelliteMapLightUrl from '../assets/campus-satellite-light.png'

const BASE_MAP_URL = baseMapUrl
const BASE_MAP_DARK_URL = baseMapDarkUrl
const SATELLITE_MAP_DARK_URL = satelliteMapDarkUrl
const SATELLITE_MAP_LIGHT_URL = satelliteMapLightUrl

const ZONE_ICON_MARKUP = {
  building: renderToStaticMarkup(<Icons.Building />),
  school: renderToStaticMarkup(<Icons.School />),
  tools: renderToStaticMarkup(<Icons.Tools />),
  coffee: renderToStaticMarkup(<Icons.Coffee />),
  parking: renderToStaticMarkup(<Icons.Parking />),
  pool: renderToStaticMarkup(<Icons.Pool />),
  sports: renderToStaticMarkup(<Icons.Sports />),
  tree: renderToStaticMarkup(<Icons.Tree />),
  road: renderToStaticMarkup(<Icons.Road />),
  gate: renderToStaticMarkup(<Icons.Gate />),
  bus: renderToStaticMarkup(<Icons.Bus />),
}

function getSatelliteMapUrl(theme) {
  return theme === 'dark' ? SATELLITE_MAP_DARK_URL : SATELLITE_MAP_LIGHT_URL
}

function getBaseMapUrl(mode, theme) {
  if (mode === 'satellite') return getSatelliteMapUrl(theme)
  return theme === 'dark' ? BASE_MAP_DARK_URL : BASE_MAP_URL
}

function getFitPadding(map) {
  const size = map?.getSize?.()
  if (!size?.x || !size?.y) return [4, 4]

  const shortestSide = Math.min(size.x, size.y)
  const padding = Math.max(2, Math.min(10, Math.round(shortestSide * 0.012)))
  return [padding, padding]
}

function getSafeZoom(map, fallback = 0) {
  const zoom = map?.getZoom?.()
  return Number.isFinite(zoom) ? zoom : fallback
}

function pointToZonePosition(point) {
  if (!point) return { px: 0, py: 0 }

  const lat = Number(point.lat ?? point[0] ?? 0)
  const lng = Number(point.lng ?? point[1] ?? 0)

  return {
    px: Math.max(0, Math.min(100, (lng / MAP_WIDTH) * 100)),
    py: Math.max(0, Math.min(100, (lat / MAP_HEIGHT) * 100)),
  }
}

function getZoneIcon(zone) {
  const glyphs = {
    entrada_principal: '🚪',
    entrada_panamericana: '🏢',
    bloque_principal: '🏛️',
    administracion: '🛠️',
    bloque_modular: '☕',
    estacionamiento_oeste: '🅿️',
    modulos_sur: '🏊',
    area_dos: '⚽',
    area_tres: '🌳',
    calle_univo: '🛣️',
    carretera_panamericana: '🛣️',
    garita_norte: '🚍',
  }

  return glyphs[zone.id] || zone.icon || '•'
}

function getZoneIconMarkup(zone) {
  return ZONE_ICON_MARKUP[zone.iconKey] || getZoneIcon(zone)
}

function makeZoneMarker(zone) {
  const glyph = getZoneIconMarkup(zone)
  const markerClassMap = {
    edificios: styles.markerEdificios,
    servicios: styles.markerServicios,
    areas_verdes: styles.markerAreas,
    estacionamiento: styles.markerEstacionamiento,
    accesos: styles.markerAccesos,
  }

  return L.divIcon({
    className: styles.zoneMarkerRoot,
    html: `
      <div class="${styles.zoneMarker} ${markerClassMap[zone.cat] || ''}" style="--zone-color: ${zone.color}">
        <span class="${styles.zoneMarkerGlyph}">${glyph}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

export default function CampusMap({
  zones,
  layers,
  activeZone,
  onZoneClick,
  onAdminPinClick = () => {},
  onToggleLayer = () => {},
  onClearRoute = () => {},
  route = null,
  routeSummary = null,
  mapMode = 'standard',
  theme = 'dark',
  user,
  onUpdateZonePosition = () => {},
  editingZoneId = null,
}) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const baseLayerRef = useRef(null)
  const mapModeRef = useRef(mapMode)
  const markerRefs = useRef({})
  const routeLayerRef = useRef(null)
  const onZoneClickRef = useRef(onZoneClick)
  const onAdminPinClickRef = useRef(onAdminPinClick)
  const onUpdateZonePositionRef = useRef(onUpdateZonePosition)
  const editingZoneIdRef = useRef(editingZoneId)
  const isAdmin = user?.access === 'admin'
  const [baseReady, setBaseReady] = useState(false)

  useEffect(() => {
    onZoneClickRef.current = onZoneClick
  }, [onZoneClick])

  useEffect(() => {
    onAdminPinClickRef.current = onAdminPinClick
  }, [onAdminPinClick])

  useEffect(() => {
    onUpdateZonePositionRef.current = onUpdateZonePosition
  }, [onUpdateZonePosition])

  useEffect(() => {
    editingZoneIdRef.current = editingZoneId
  }, [editingZoneId])

  useEffect(() => {
    mapModeRef.current = mapMode
  }, [mapMode, theme])

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

    const baseLayer = L.imageOverlay(getBaseMapUrl(mapMode, theme), MAP_BOUNDS, {
      pane: 'campus-base',
      interactive: false,
    })
    baseLayerRef.current = baseLayer

    const applyBaseStyle = () => {
      const element = baseLayer.getElement?.()
      if (!element) return

      element.style.transition = 'filter 180ms ease, opacity 180ms ease'
      if (mapModeRef.current === 'satellite') {
        element.style.filter = 'saturate(1.15) contrast(1.08) brightness(0.92) hue-rotate(-8deg)'
      } else {
        element.style.filter = 'none'
      }
    }

    const markReady = () => {
      if (!alive) return
      if (baseLayerRef.current !== baseLayer) return
      setBaseReady(true)
      applyBaseStyle()
    }

    baseLayer.on('load', markReady)
    baseLayer.on('error', markReady)
    baseLayer.addTo(map)

    const readyTimer = window.setTimeout(markReady, 80)

    zones.forEach(zone => {
      const marker = L.marker(pointFromZone(zone), {
        pane: 'campus-markers',
        icon: makeZoneMarker(zone),
        keyboard: true,
        interactive: true,
        riseOnHover: true,
        draggable: isAdmin,
      })

      marker.bindTooltip(zone.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -8],
        className: styles.zoneTooltip,
        opacity: 1,
        sticky: true,
      })

      const openZone = (event) => {
        event?.preventDefault?.()
        event?.stopPropagation?.()
        if (event?.originalEvent) {
          L.DomEvent.stop(event.originalEvent)
        }
        if (isAdmin) {
          onAdminPinClickRef.current(zone)
          return
        }
        onZoneClickRef.current(zone)
      }

      marker.on('add', () => {
        const el = marker.getElement?.()
        if (!el) return
        L.DomEvent.disableClickPropagation(el)
        L.DomEvent.disableScrollPropagation(el)
        el.setAttribute('role', 'button')
        el.setAttribute('tabindex', '0')
        el.setAttribute('aria-label', zone.name)
        el.setAttribute('title', zone.name)
        el.style.cursor = isAdmin && editingZoneId === zone.id ? 'move' : 'pointer'

        let lastTouchAt = 0
        const handleClick = (event) => {
          if (Date.now() - lastTouchAt < 700) return
          openZone(event)
        }

        const handleTouchEnd = (event) => {
          lastTouchAt = Date.now()
          openZone(event)
        }

        const handleKeyDown = (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          openZone(event)
        }

        const handleDragEnd = () => {
          if (!isAdmin || editingZoneIdRef.current !== zone.id) return
          const nextPosition = pointToZonePosition(marker.getLatLng())
          onUpdateZonePositionRef.current(zone.id, nextPosition)
        }

        el.addEventListener('click', handleClick)
        el.addEventListener('touchend', handleTouchEnd, { passive: false })
        el.addEventListener('keydown', handleKeyDown)
        marker.on('dragend', handleDragEnd)

        marker.once('remove', () => {
          el.removeEventListener('click', handleClick)
          el.removeEventListener('touchend', handleTouchEnd)
          el.removeEventListener('keydown', handleKeyDown)
          marker.off('dragend', handleDragEnd)
        })
      })

      if (isAdmin) {
        marker.on('dragstart', () => {
          marker.getElement?.()?.classList.add(styles.markerDragging)
        })
        marker.on('dragend', () => {
          marker.getElement?.()?.classList.remove(styles.markerDragging)
        })
      } else {
        marker.dragging?.disable?.()
      }

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
        map.fitBounds(MAP_BOUNDS, { padding: getFitPadding(map), animate: false })
      } catch {
        map.setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], 0, { animate: false })
      }
    }

    const rafId = window.requestAnimationFrame(fitCampus)
    const handleResize = () => {
      map.invalidateSize()
      window.requestAnimationFrame(fitCampus)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      alive = false
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(readyTimer)
      baseLayer.off('load', markReady)
      baseLayer.off('error', markReady)
      baseLayerRef.current?.remove()
      baseLayerRef.current = null
      routeLayerRef.current?.remove()
      routeLayerRef.current = null
      map.remove()
      markerRefs.current = {}
      mapRef.current = null
    }
  }, [isAdmin])

  useEffect(() => {
    const baseLayer = baseLayerRef.current
    if (!baseLayer) return

    const nextUrl = getBaseMapUrl(mapMode, theme)
    baseLayer.setUrl(nextUrl)
  }, [mapMode, theme])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    zones.forEach(zone => {
      const marker = markerRefs.current[zone.id]
      if (!marker) return

      const visible = !!layers[zone.cat]
      const isActive = activeZone?.id === zone.id
      marker.setLatLng(pointFromZone(zone))

      if (!map.hasLayer(marker)) {
        marker.addTo(map)
      }

      marker.setOpacity(visible ? 1 : 0.38)

      const el = marker.getElement?.()
      if (el) {
        el.style.filter = visible ? 'none' : 'grayscale(0.2) saturate(0.75)'
        el.style.transition = 'opacity 180ms ease, filter 180ms ease, transform 180ms ease'
      }

      if (isActive) {
        marker.setZIndexOffset(1000)
      } else if (visible) {
        marker.setZIndexOffset(0)
      } else {
        marker.setZIndexOffset(-150)
      }
    })
  }, [zones, layers, activeZone, route])

  useEffect(() => {
    zones.forEach(zone => {
      const marker = markerRefs.current[zone.id]
      if (!marker) return

      const editable = isAdmin && editingZoneId === zone.id
      if (editable) {
        marker.dragging?.enable?.()
      } else {
        marker.dragging?.disable?.()
      }

      const el = marker.getElement?.()
      if (el) {
        el.style.cursor = editable ? 'move' : 'pointer'
      }
    })
  }, [zones, isAdmin, editingZoneId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    routeLayerRef.current?.remove()
    routeLayerRef.current = null

      if (!route?.points?.length) {
        if (!activeZone) {
          try {
            map.fitBounds(MAP_BOUNDS, { padding: getFitPadding(map), animate: false })
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
    const map = mapRef.current
    if (!map) return

    map.fitBounds(MAP_BOUNDS, { padding: getFitPadding(map), animate: true })
  }

  const handleFocusActive = (e) => {
    e.stopPropagation()

    const map = mapRef.current
    if (!map) return

    if (activeZone && layers[activeZone.cat]) {
      const point = pointFromZone(activeZone)
      const nextZoom = Math.min(4.35, Math.max(getSafeZoom(map, 2.8), 2.8) + 0.15)
      map.setView(point, nextZoom, { animate: true })
      return
    }

    if (routeSummary?.points?.length) {
      const routeCenter = routeSummary.points.reduce(
        (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
        [0, 0]
      ).map(total => total / routeSummary.points.length)

      map.setView(routeCenter, Math.min(4.5, Math.max(getSafeZoom(map, 2.8), 2.8) + 0.15), {
        animate: true,
      })
      return
    }

    map.fitBounds(MAP_BOUNDS, { padding: getFitPadding(map), animate: true })
  }

  const handleFocusRoute = (e) => {
    e.stopPropagation()

    const map = mapRef.current
    if (!map || !routeSummary?.points?.length) return

    const routeCenter = routeSummary.points.reduce(
      (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
      [0, 0]
    ).map(total => total / routeSummary.points.length)

    map.setView(routeCenter, Math.min(4.5, Math.max(getSafeZoom(map, 2.8), 2.8) + 0.15), {
      animate: true,
    })
  }

  return (
    <div className={styles.mapArea}>
      <div
        ref={mapNodeRef}
        className={`${styles.leafletViewport} ${mapMode === 'satellite' ? styles.modeSatellite : ''} ${mapMode === 'standard' && theme === 'dark' ? styles.modeStandardDark : ''} ${mapMode === 'standard' && theme === 'light' ? styles.modeStandardLight : ''}`}
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
            <div className={styles.navigationActions}>
              <button
                className={styles.navigationButton}
                onClick={handleFocusRoute}
                title="Centrar ruta"
                aria-label="Centrar ruta"
              >
                <Icons.Route />
              </button>
              <button
                className={styles.navigationCancel}
                onClick={onClearRoute}
                title="Cancelar navegacion"
                aria-label="Cancelar navegacion"
              >
                <Icons.Reset />
                <span>Cancelar</span>
              </button>
            </div>
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
        <div className={styles.ctrlDivider} />

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
