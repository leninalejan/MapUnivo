// src/App.jsx
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Topbar      from './components/Topbar.jsx'
import Sidebar     from './components/Sidebar.jsx'
import InfoPanel   from './components/InfoPanel.jsx'
import LayerPanel  from './components/LayerPanel.jsx'
import UserMenu    from './components/UserMenu.jsx'
import StatusBar   from './components/StatusBar.jsx'
import Toast       from './components/Toast.jsx'
import { CAMPUS_ZONES, LAYER_CONFIG } from './data/campusData.js'
import { buildCampusRoute, findCampusLocation } from './data/campusRoutes.js'
import styles from './App.module.css'

const CampusMap = lazy(() => import('./components/CampusMap.jsx'))

const DEFAULT_USER = {
  username: 'invitado',
  name: 'Invitado UNIVO',
  role: 'Acceso directo al mapa',
  initials: 'IU',
  carnet: 'MAP-000',
}

export default function App() {
  const user = DEFAULT_USER
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'

    try {
      const storedTheme = window.localStorage.getItem('mapunivo-theme')
      if (storedTheme) return storedTheme
    } catch {
      // Ignore storage access issues and fall back to system/default.
    }

    try {
      return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      window.localStorage.setItem('mapunivo-theme', theme)
    } catch {
      // Keep rendering even if storage is unavailable.
    }

    document.getElementById('boot-loader')?.remove()
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <AppErrorBoundary>
      <MainApp user={user} theme={theme} onToggleTheme={toggleTheme} />
    </AppErrorBoundary>
  )
}

function MapLoadingFallback() {
  return (
    <div className={styles.mapLoading}>
      <div className={styles.mapLoadingCard}>
        <div className={styles.mapLoadingSpinner} />
        <div className={styles.mapLoadingTitle}>Cargando mapa UNIVO</div>
        <div className={styles.mapLoadingText}>
          Estamos preparando el plano y las capas del campus...
        </div>
      </div>
    </div>
  )
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Se produjo un error al cargar la interfaz.',
    }
  }

  componentDidCatch() {
    document.getElementById('boot-loader')?.remove()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className={styles.appError}>
        <div className={styles.appErrorCard}>
          <div className={styles.appErrorTitle}>No se pudo cargar UNIVO Maps</div>
          <div className={styles.appErrorText}>
            {this.state.message}
          </div>
          <button
            className={styles.appErrorButton}
            onClick={() => window.location.reload()}
          >
            Recargar pagina
          </button>
        </div>
      </div>
    )
  }
}

// ─── Main application shell ───────────────────────────────────────────────────
function MainApp({ user, theme, onToggleTheme }) {
  const [activeZone,   setActiveZone]   = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLayers,   setShowLayers]   = useState(false)
  const [toast,        setToast]        = useState(null)
  const [routeFrom,    setRouteFrom]    = useState('')
  const [routeTo,      setRouteTo]      = useState('')
  const [routePlan,    setRoutePlan]    = useState(null)
  const [routeError,   setRouteError]   = useState('')

  // Build default layer state from config
  const defaultLayers = useMemo(() => {
    const o = {}
    LAYER_CONFIG.forEach(l => { o[l.id] = l.defaultOn })
    return o
  }, [])
  const [layers, setLayers] = useState(defaultLayers)

  // Close dropdowns on outside click
  useEffect(() => {
    const h = () => { setShowUserMenu(false); setShowLayers(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  const handleZoneClick = (zone) => {
    setActiveZone(zone)
    setLayers(prev => (prev[zone.cat] ? prev : { ...prev, [zone.cat]: true }))
    setToast({ msg: zone.name, icon: zone.icon })
  }

  const handleToggleLayer = (id) => {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const syncRouteLayers = (origin, destination) => {
    setLayers(prev => ({
      ...prev,
      [origin.cat]: true,
      [destination.cat]: true,
    }))
  }

  const showRoute = (origin, destination) => {
    const route = buildCampusRoute(origin, destination)
    if (!route) {
      setRoutePlan(null)
      const msg = `No se pudo trazar una ruta entre ${origin.name} y ${destination.name}.`
      setRouteError(msg)
      setToast({ msg, icon: '!' })
      return false
    }

    syncRouteLayers(origin, destination)
    setRouteFrom(origin.name)
    setRouteTo(destination.name)
    setRoutePlan(route)
    setRouteError('')
    setActiveZone(destination)
    setToast({
      msg: `Ruta lista: ${origin.name} → ${destination.name}`,
      icon: '↗',
    })
    return true
  }

  const handleCalculateRoute = () => {
    const origin = findCampusLocation(routeFrom)
    const destination = findCampusLocation(routeTo)

    if (!origin || !destination) {
      setRoutePlan(null)
      const msg = !origin && !destination
        ? 'Escribe un punto de inicio y un destino válidos.'
        : !origin
          ? 'No reconozco el punto de inicio. Prueba con "Entrada Principal".'
          : 'No reconozco el destino. Prueba con "Bloque Principal de Aulas".'
      setRouteError(msg)
      setToast({ msg, icon: '!' })
      return
    }

    if (origin.id === destination.id) {
      setRoutePlan(null)
      const msg = 'El inicio y el destino no pueden ser el mismo punto.'
      setRouteError(msg)
      setToast({ msg, icon: '!' })
      return
    }

    showRoute(origin, destination)
  }

  const handleRouteHere = (zone) => {
    const origin = findCampusLocation(routeFrom) || findCampusLocation('Entrada Principal') || activeZone || zone
    if (!origin) return

    setRouteFrom(origin.name)
    setRouteTo(zone.name)
    showRoute(origin, zone)
  }

  const handleClearRoute = () => {
    setRoutePlan(null)
    setRouteError('')
    setToast({ msg: 'Ruta limpiada.', icon: '↺' })
  }

  return (
    <div className={styles.app} onClick={() => { setShowUserMenu(false); setShowLayers(false) }}>

      {/* ── Topbar ── */}
      <Topbar
        user={user}
        onSearch={handleZoneClick}
        layersOpen={showLayers}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onToggleLayers={e => { e.stopPropagation(); setShowLayers(p => !p); setShowUserMenu(false) }}
        onToggleUser={e  => { e.stopPropagation(); setShowUserMenu(p => !p); setShowLayers(false) }}
      />

      {/* ── Sidebar ── */}
      <Sidebar
        activeZone={activeZone}
        onZoneClick={handleZoneClick}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        routeFrom={routeFrom}
        routeTo={routeTo}
        onRouteFromChange={value => { setRouteFrom(value); setRouteError('') }}
        onRouteToChange={value => { setRouteTo(value); setRouteError('') }}
        onCalculateRoute={handleCalculateRoute}
        routeSummary={routePlan}
        routeError={routeError}
        onClearRoute={handleClearRoute}
      />

      {/* ── Map area ── */}
      <div className={styles.mapWrapper} onClick={e => e.stopPropagation()}>
        <Suspense fallback={<MapLoadingFallback />}>
          <CampusMap
            zones={CAMPUS_ZONES}
            layers={layers}
            activeZone={activeZone}
            onZoneClick={handleZoneClick}
            onToggleLayer={handleToggleLayer}
            route={routePlan}
          />
        </Suspense>

        {/* Layer panel floating over map */}
        {showLayers && (
          <div className={styles.layerPanelAnchor} onClick={e => e.stopPropagation()}>
            <LayerPanel
              layers={layers}
              onToggle={handleToggleLayer}
              onClose={() => setShowLayers(false)}
            />
          </div>
        )}

        {/* Zone info panel */}
        {activeZone && (
          <InfoPanel
            zone={activeZone}
            onClose={() => setActiveZone(null)}
            onRouteHere={handleRouteHere}
          />
        )}
      </div>

      {/* ── Status bar ── */}
      <StatusBar activeZone={activeZone} />

      {/* ── User dropdown (portal-like, fixed position) ── */}
      {showUserMenu && (
        <UserMenu
          user={user}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onClose={() => setShowUserMenu(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast msg={toast.msg} icon={toast.icon} onDone={() => setToast(null)} />
      )}
    </div>
  )
}
