// src/components/CampusMap.jsx
// Interactive map built on the real topographic plan of UNIVO campus
// Plan: Plano Topográfico, Esc. 1:1000, Cantón Orrajuelo, San Miguel
// Areas: Área Tres (N 45,784m²) · Área Uno (center 29,899m²) · Área Dos (E 3,970m²)
// Borders: Carretera Panamericana (S) · Calle Universidad de Oriente (E)

import { useRef, useState, useEffect, useCallback } from 'react'
import { CAMPUS_ZONES, GOOGLE_MAPS_API_KEY, CAMPUS_CENTER } from '../data/campusData.js'
import { Icons } from './Icons.jsx'
import styles from './CampusMap.module.css'
const campusMapImage = '/campus_map.jpg'

// ─── Google Maps wrapper (active when API key provided) ─────────────────────
function GoogleMapView({ zones, layers, activeZone, onZoneClick }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const markersRef  = useRef({})

  useEffect(() => {
    if (!window.google || mapInstance.current) return

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: CAMPUS_CENTER,
      zoom: 17,
      disableDefaultUI: true,
      styles: DARK_STYLE,
    })

    // Campus boundary polygon (approximate from topographic plan)
    new window.google.maps.Polygon({
      paths: [
        { lat: 13.3408, lng: -88.4430 },
        { lat: 13.3410, lng: -88.4400 },
        { lat: 13.3395, lng: -88.4392 },
        { lat: 13.3375, lng: -88.4405 },
        { lat: 13.3368, lng: -88.4428 },
        { lat: 13.3382, lng: -88.4445 },
      ],
      strokeColor: '#0F5EA8', strokeOpacity: 0.4, strokeWeight: 2,
      fillColor: '#0F5EA8', fillOpacity: 0.06,
      map: mapInstance.current,
    })

    // Place markers
    zones.forEach(z => {
      const marker = new window.google.maps.Marker({
        position: { lat: z.lat || CAMPUS_CENTER.lat, lng: z.lng || CAMPUS_CENTER.lng },
        map: mapInstance.current,
        title: z.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10, fillColor: z.color, fillOpacity: 0.95,
          strokeColor: '#fff', strokeWeight: 1.5,
        },
      })
      marker.addListener('click', () => onZoneClick(z))
      markersRef.current[z.id] = { marker, zone: z }
    })
  }, [])

  useEffect(() => {
    Object.values(markersRef.current).forEach(({ marker, zone }) => {
      marker.setVisible(!!layers[zone.cat])
    })
  }, [layers])

  useEffect(() => {
    if (activeZone && mapInstance.current) {
      mapInstance.current.panTo({ lat: activeZone.lat || CAMPUS_CENTER.lat, lng: activeZone.lng || CAMPUS_CENTER.lng })
      mapInstance.current.setZoom(19)
    }
  }, [activeZone])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}

// ─── Static plan map (used when no Google Maps API key) ─────────────────────
function PlanMap({ zones, layers, activeZone, onZoneClick }) {
  const containerRef = useRef(null)
  const [scale,  setScale]  = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging  = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const lastOffset= useRef({ x: 0, y: 0 })

  // ── Image natural dimensions of campus_map.jpg (2180×2100)
  // We display it at 900×868 (same ratio) and position markers as % of those dims
  const IMG_W = 900
  const IMG_H = 868

  const MIN_SCALE = 0.7
  const MAX_SCALE = 5

  const centerMap = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const centeredScale = Math.min(
      1,
      el.clientWidth / IMG_W,
      el.clientHeight / IMG_H,
    )

    setScale(centeredScale)
    setOffset({
      x: (el.clientWidth - IMG_W * centeredScale) / 2,
      y: (el.clientHeight - IMG_H * centeredScale) / 2,
    })
  }, [])

  // Wheel zoom centered on cursor
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect  = containerRef.current.getBoundingClientRect()
    const cx    = e.clientX - rect.left
    const cy    = e.clientY - rect.top
    const delta = e.deltaY > 0 ? -0.12 : 0.12
    setScale(s => {
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta * s))
      const factor = ns / s
      setOffset(o => ({
        x: cx - factor * (cx - o.x),
        y: cy - factor * (cy - o.y),
      }))
      return ns
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    centerMap()
    window.addEventListener('resize', centerMap)
    return () => window.removeEventListener('resize', centerMap)
  }, [centerMap])

  // Pan via mouse drag
  const onPointerDown = (e) => {
    if (e.button !== 0) return
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    lastOffset.current = offset
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragging.current) return
    setOffset({
      x: lastOffset.current.x + (e.clientX - dragStart.current.x),
      y: lastOffset.current.y + (e.clientY - dragStart.current.y),
    })
  }
  const onPointerUp = () => { dragging.current = false }

  // Reset view
  const resetView = () => { centerMap() }

  const visibleZones = zones.filter(z => layers[z.cat])

  return (
    <div
      ref={containerRef}
      className={styles.planContainer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
    >
      {/* Transformed map stage */}
      <div
        className={styles.mapStage}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          width: IMG_W,
          height: IMG_H,
        }}
      >
        {/* Real topographic plan image */}
        <img
          src={campusMapImage}
          alt="Plano Topográfico UNIVO — Esc. 1:1000"
          className={styles.planImg}
          draggable={false}
        />

        {/* SVG overlay — markers calibrated to plan */}
        <svg
          className={styles.markerSvg}
          viewBox={`0 0 ${IMG_W} ${IMG_H}`}
          width={IMG_W}
          height={IMG_H}
        >
          {/* ── Area labels overlaid on the plan ── */}
          <text x="330" y="245" textAnchor="middle"
            fill="rgba(242,181,68,0.65)" fontSize="9" fontFamily="Outfit"
            fontWeight="600" letterSpacing="1" style={{pointerEvents:'none'}}>
            ÁREA TRES · 45,784 m²
          </text>
          <text x="430" y="620" textAnchor="middle"
            fill="rgba(15,94,168,0.62)" fontSize="9" fontFamily="Outfit"
            fontWeight="600" letterSpacing="1" style={{pointerEvents:'none'}}>
            ÁREA UNO · 29,899 m²
          </text>
          <text x="756" y="570" textAnchor="middle"
            fill="rgba(28,156,114,0.55)" fontSize="8" fontFamily="Outfit"
            fontWeight="600" letterSpacing="1" style={{pointerEvents:'none'}}>
            ÁREA DOS · 3,970 m²
          </text>

          {/* ── Road labels ── */}
          <text x="245" y="820" textAnchor="middle"
            fill="rgba(242,181,68,0.72)" fontSize="8.5" fontFamily="Outfit"
            fontWeight="600" letterSpacing="2"
            transform="rotate(-16,245,820)"
            style={{pointerEvents:'none'}}>
            CARRETERA PANAMERICANA
          </text>
          <text x="760" y="330" textAnchor="middle"
            fill="rgba(242,181,68,0.72)" fontSize="8" fontFamily="Outfit"
            fontWeight="600" letterSpacing="1.5"
            transform="rotate(74,760,330)"
            style={{pointerEvents:'none'}}>
            CALLE UNIVERSIDAD DE ORIENTE
          </text>

          {/* ── Zone markers ── */}
          {visibleZones.map(z => {
            const cx = (z.px / 100) * IMG_W
            const cy = (z.py / 100) * IMG_H
            const isActive = activeZone?.id === z.id
            const r = isActive ? 11 : 8

            return (
              <g
                key={z.id}
                style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); onZoneClick(z) }}
              >
                {/* Outer pulse ring when active */}
                {isActive && (
                  <>
                    <circle cx={cx} cy={cy} r={r + 12}
                      fill="none" stroke={z.color} strokeWidth="1"
                      opacity="0.3"
                      style={{ animation: 'pulse 1.8s ease infinite' }}
                    />
                    <circle cx={cx} cy={cy} r={r + 6}
                      fill="none" stroke={z.color} strokeWidth="1.5"
                      opacity="0.5"
                      style={{ animation: 'pulse 1.8s ease infinite 0.3s' }}
                    />
                  </>
                )}

                {/* Drop shadow */}
                <circle cx={cx} cy={cy + 1.5} r={r + 2} fill="rgba(0,0,0,0.35)" />

                {/* Main dot */}
                <circle
                  cx={cx} cy={cy} r={r}
                  fill={z.color}
                  stroke={isActive ? '#fff' : 'rgba(255,255,255,0.72)'}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ filter: `drop-shadow(0 0 ${isActive ? 10 : 4}px ${z.color}99)` }}
                />

                {/* Icon inside dot */}
                <text
                  x={cx} y={cy + 4}
                  textAnchor="middle" fontSize={isActive ? '10' : '8'}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {z.icon}
                </text>

                {/* Label pill */}
                <rect
                  x={cx - 46} y={cy - r - 22}
                  width={92} height={16} rx={8}
                  fill="rgba(8,10,16,0.88)"
                  stroke={isActive ? z.color : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isActive ? 1 : 0.5}
                />
                <text
                  x={cx} y={cy - r - 10}
                  textAnchor="middle"
                  fill={isActive ? z.color : '#dde1ea'}
                  fontSize={isActive ? '8.5' : '7.5'}
                  fontFamily="Outfit" fontWeight="600"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {z.name.length > 20 ? z.name.slice(0, 20) + '…' : z.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Zoom / reset buttons */}
      <div className={styles.zoomControls}>
        <button className={styles.ctrlBtn} onClick={() => setScale(s => Math.min(MAX_SCALE, s + 0.25))} title="Acercar">
          <Icons.Plus />
        </button>
        <button className={styles.ctrlBtn} onClick={() => setScale(s => Math.max(MIN_SCALE, s - 0.25))} title="Alejar">
          <Icons.Minus />
        </button>
        <div className={styles.ctrlDivider} />
        <button className={styles.ctrlBtn} onClick={resetView} title="Restablecer vista">
          <Icons.Reset />
        </button>
        <button className={styles.ctrlBtn} onClick={() => alert('Vista satélite disponible con Google Maps API Key')} title="Vista satélite">
          <Icons.Eye />
        </button>
      </div>

      {/* Plan badge */}
      <div className={styles.planBadge}>
        📐 Plano Topográfico UNIVO · Esc. 1:1000 · San Miguel
      </div>

      {/* API key notice */}
      <div className={styles.apiNotice}>
        🔑 Activa Google Maps reemplazando{' '}
        <code>YOUR_API_KEY</code> en{' '}
        <code>src/data/campusData.js</code>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function CampusMap({ zones, layers, activeZone, onZoneClick }) {
  const [mapsLoaded, setMapsLoaded] = useState(false)

  useEffect(() => {
    if (GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY') return
    if (window.google) { setMapsLoaded(true); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__GMapsReady`
    window.__GMapsReady = () => setMapsLoaded(true)
    document.head.appendChild(s)
  }, [])

  return (
    <div className={styles.mapArea}>
      {mapsLoaded
        ? <GoogleMapView zones={zones} layers={layers} activeZone={activeZone} onZoneClick={onZoneClick} />
        : <PlanMap       zones={zones} layers={layers} activeZone={activeZone} onZoneClick={onZoneClick} />
      }
    </div>
  )
}

// ─── Google Maps dark style ──────────────────────────────────────────────────
const DARK_STYLE = [
  { elementType: 'geometry',              stylers: [{ color: '#0a0c10' }] },
  { elementType: 'labels.text.stroke',    stylers: [{ color: '#0a0c10' }] },
  { elementType: 'labels.text.fill',      stylers: [{ color: '#7a8099' }] },
  { featureType: 'road',          elementType: 'geometry',        stylers: [{ color: '#181b22' }] },
  { featureType: 'road',          elementType: 'geometry.stroke', stylers: [{ color: '#111318' }] },
  { featureType: 'road.highway',  elementType: 'geometry',        stylers: [{ color: '#1e2330' }] },
  { featureType: 'water',         elementType: 'geometry',        stylers: [{ color: '#050a0f' }] },
  { featureType: 'poi.park',      elementType: 'geometry',        stylers: [{ color: '#0d1a0d' }] },
  { featureType: 'administrative',elementType: 'geometry',        stylers: [{ color: '#1e2330' }] },
]
