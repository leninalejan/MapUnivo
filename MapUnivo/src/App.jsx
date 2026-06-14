import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import LoginScreen from './components/LoginScreen.jsx'
import Topbar from './components/Topbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import InfoPanel from './components/InfoPanel.jsx'
import LayerPanel from './components/LayerPanel.jsx'
import MapModePanel from './components/MapModePanel.jsx'
import UserMenu from './components/UserMenu.jsx'
import StatusBar from './components/StatusBar.jsx'
import Toast from './components/Toast.jsx'
import { AUTH_USERS } from './data/authUsers.js'
import { getIconGlyphByKey } from './data/iconOptions.js'
import { CAMPUS_ZONES, LAYER_CONFIG } from './data/campusData.js'
import { buildCampusRoute, findCampusLocation, getRouteGuide } from './data/campusRoutes.js'
import { loadMapState, saveMapState } from './lib/mapStateApi.js'
import styles from './App.module.css'

const CampusMap = lazy(() => import('./components/CampusMap.jsx'))

const AUTH_STORAGE_KEY = 'mapunivo-session'
const SITE_STORAGE_KEY = 'mapunivo-site-content'
const ZONE_POSITIONS_KEY = 'mapunivo-zone-positions'
const CUSTOM_ZONES_KEY = 'mapunivo-custom-zones'
const SIDEBAR_WIDTH_KEY = 'mapunivo-sidebar-width'

const DEFAULT_SITE_CONTENT = {
  bannerTitle: 'Bienvenido a MapUNIVO',
  bannerBody: 'Consulta el campus, ubica zonas y, si eres administrador, actualiza este mensaje desde el menu de usuario.',
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizeZonePositions(rawPositions) {
  const positions = {}

  if (!rawPositions || typeof rawPositions !== 'object') return positions

  for (const zone of CAMPUS_ZONES) {
    const next = rawPositions[zone.id]
    if (!next || typeof next !== 'object') continue

    const px = Number(next.px)
    const py = Number(next.py)

    if (Number.isFinite(px) && Number.isFinite(py)) {
      positions[zone.id] = {
        px: clamp(px, 0, 100),
        py: clamp(py, 0, 100),
      }
    }
  }

  return positions
}

function getDefaultZonePositions() {
  const positions = {}
  CAMPUS_ZONES.forEach(zone => {
    positions[zone.id] = { px: zone.px, py: zone.py }
  })
  return positions
}

function normalizeCustomZone(zone) {
  if (!zone || typeof zone !== 'object') return null

  const id = String(zone.id || '').trim()
  const name = String(zone.name || '').trim()
  if (!id || !name) return null

  const px = Number(zone.px)
  const py = Number(zone.py)
  const iconKey = String(zone.iconKey || 'Pin')
  const glyph = String(zone.icon || getIconGlyphByKey(iconKey))

  return {
    id,
    name,
    badge: String(zone.badge || 'NUEVO').trim() || 'NUEVO',
    cat: ['edificios', 'servicios', 'areas_verdes', 'estacionamiento', 'accesos'].includes(zone.cat)
      ? zone.cat
      : 'servicios',
    iconKey,
    icon: glyph,
    color: String(zone.color || '#0F5EA8'),
    px: Number.isFinite(px) ? clamp(px, 0, 100) : 50,
    py: Number.isFinite(py) ? clamp(py, 0, 100) : 50,
    desc: String(zone.desc || 'Punto agregado por el administrador.'),
    horario: String(zone.horario || 'Editable por admin'),
    tel: String(zone.tel || '---'),
    custom: true,
  }
}

export default function App() {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null

    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      return AUTH_USERS.find(u => u.username === parsed?.username) || parsed
    } catch {
      return null
    }
  })

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

  const [siteContent, setSiteContent] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SITE_CONTENT

    try {
      const stored = window.localStorage.getItem(SITE_STORAGE_KEY)
      return stored ? { ...DEFAULT_SITE_CONTENT, ...JSON.parse(stored) } : DEFAULT_SITE_CONTENT
    } catch {
      return DEFAULT_SITE_CONTENT
    }
  })

  const [zonePositions, setZonePositions] = useState(() => {
    if (typeof window === 'undefined') return {}

    try {
      const stored = window.localStorage.getItem(ZONE_POSITIONS_KEY)
      return stored ? normalizeZonePositions(JSON.parse(stored)) : {}
    } catch {
      return {}
    }
  })

  const [customZones, setCustomZones] = useState(() => {
    if (typeof window === 'undefined') return []

    try {
      const stored = window.localStorage.getItem(CUSTOM_ZONES_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed.map(normalizeCustomZone).filter(Boolean) : []
    } catch {
      return []
    }
  })
  const [mapStateLoaded, setMapStateLoaded] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      window.localStorage.setItem('mapunivo-theme', theme)
    } catch {
      // Keep rendering even if storage is unavailable.
    }

    document.getElementById('boot-loader')?.remove()
  }, [theme])

  useEffect(() => {
    if (!user) {
      try {
        window.localStorage.removeItem(AUTH_STORAGE_KEY)
      } catch {
        // Ignore storage errors.
      }
      return
    }

    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } catch {
      // Ignore storage errors.
    }
  }, [user])

  useEffect(() => {
    try {
      window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(siteContent))
    } catch {
      // Ignore storage errors.
    }
  }, [siteContent])

  useEffect(() => {
    try {
      window.localStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(customZones))
    } catch {
      // Ignore storage errors.
    }
  }, [customZones])

  useEffect(() => {
    let cancelled = false

    const hydrateSharedMapState = async () => {
      try {
        const sharedState = await loadMapState()
        if (cancelled || !sharedState) return

        if (sharedState.siteContent) {
          setSiteContent(prev => ({
            ...DEFAULT_SITE_CONTENT,
            ...prev,
            ...sharedState.siteContent,
          }))
        }

        if (sharedState.zonePositions) {
          setZonePositions(normalizeZonePositions(sharedState.zonePositions))
        }

        if (Array.isArray(sharedState.customZones)) {
          setCustomZones(sharedState.customZones.map(normalizeCustomZone).filter(Boolean))
        }
      } catch {
        // Keep local cache if the shared state API is unavailable.
      } finally {
        if (!cancelled) {
          setMapStateLoaded(true)
        }
      }
    }

    hydrateSharedMapState()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mapStateLoaded) return

    const payload = {
      siteContent,
      zonePositions,
      customZones,
    }

    saveMapState(payload).catch(() => {
      // Keep the local cache even if the shared API is temporarily down.
    })
  }, [mapStateLoaded, siteContent, zonePositions, customZones])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleLogin = (loggedUser) => {
    setUser(AUTH_USERS.find(u => u.username === loggedUser.username) || loggedUser)
  }

  const handleLogout = () => {
    setUser(null)
  }

  const handleUpdateSiteContent = (nextContent) => {
    setSiteContent(prev => ({ ...prev, ...nextContent }))
  }

  const handleUpdateZonePosition = (zoneId, nextPosition) => {
    setZonePositions(prev => ({
      ...prev,
      [zoneId]: {
        px: clamp(Number(nextPosition?.px) || 0, 0, 100),
        py: clamp(Number(nextPosition?.py) || 0, 0, 100),
      },
    }))
  }

  const handleSaveZonePositions = () => {
    try {
      window.localStorage.setItem(ZONE_POSITIONS_KEY, JSON.stringify(zonePositions))
    } catch {
      // Ignore storage errors.
    }
  }

  const handleResetZonePosition = (zoneId) => {
    const defaults = getDefaultZonePositions()
    const customZone = customZones.find(zone => zone.id === zoneId)
    const nextPositions = {
      ...zonePositions,
      [zoneId]: defaults[zoneId] || (customZone ? { px: customZone.px, py: customZone.py } : { px: 50, py: 50 }),
    }

    setZonePositions(nextPositions)

    try {
      window.localStorage.setItem(ZONE_POSITIONS_KEY, JSON.stringify(nextPositions))
    } catch {
      // Ignore storage errors.
    }
  }

  const handleAddCustomZone = (zoneDraft) => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const iconKey = String(zoneDraft?.iconKey || 'Pin')
    const nextZone = normalizeCustomZone({
      id,
      name: zoneDraft?.name,
      badge: zoneDraft?.badge,
      cat: zoneDraft?.cat,
      iconKey,
      icon: getIconGlyphByKey(iconKey),
      color: zoneDraft?.color,
      px: zoneDraft?.px ?? 50,
      py: zoneDraft?.py ?? 50,
      desc: zoneDraft?.desc,
      horario: zoneDraft?.horario,
      tel: zoneDraft?.tel,
    })

    if (!nextZone) return null

    setCustomZones(prev => [...prev, nextZone])
    return nextZone
  }

  const handleDeleteCustomZone = (zoneId) => {
    const zone = customZones.find(item => item.id === zoneId)
    if (!zone) {
      setToast({ msg: 'Ese pin no se puede eliminar.', icon: '⚠️' })
      return
    }

    const confirmed = window.confirm(`¿Eliminar el pin "${zone.name}"?`)
    if (!confirmed) return

    setCustomZones(prev => prev.filter(item => item.id !== zoneId))
    setZonePositions(prev => {
      if (!(zoneId in prev)) return prev
      const next = { ...prev }
      delete next[zoneId]
      return next
    })

    setActiveZone(prev => (prev?.id === zoneId ? null : prev))
    setAdminZoneMenu(prev => (prev?.id === zoneId ? null : prev))
    setEditingZoneId(prev => (prev === zoneId ? null : prev))

    if (routePlan?.origin?.id === zoneId || routePlan?.destination?.id === zoneId) {
      setRoutePlan(null)
      setRouteFrom('')
      setRouteTo('')
      setRouteError('')
    }

    setToast({ msg: `${zone.name} eliminado.`, icon: '🗑️' })
  }

  const zones = useMemo(() => {
    return [...CAMPUS_ZONES, ...customZones].map(zone => {
      const override = zonePositions[zone.id]
      if (!override) return zone
      return {
        ...zone,
        px: override.px,
        py: override.py,
      }
    })
  }, [zonePositions, customZones])

  return (
    <AppErrorBoundary>
      {user ? (
        <MainApp
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          siteContent={siteContent}
          onUpdateSiteContent={handleUpdateSiteContent}
          zones={zones}
          onUpdateZonePosition={handleUpdateZonePosition}
          onSaveZonePositions={handleSaveZonePositions}
          onResetZonePosition={handleResetZonePosition}
          onAddCustomZone={handleAddCustomZone}
          onDeleteCustomZone={handleDeleteCustomZone}
        />
      ) : (
        <LoginScreen
          onLogin={handleLogin}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </AppErrorBoundary>
  )
}

function MapLoadingFallback() {
  return (
    <div className={styles.mapLoading}>
      <div className={styles.mapLoadingCard}>
        <div className={styles.mapLoadingSpinner} />
        <div className={styles.mapLoadingTitle}>Cargando MapUNIVO</div>
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
          <div className={styles.appErrorTitle}>No se pudo cargar MapUNIVO</div>
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

function MainApp({
  user,
  theme,
  onToggleTheme,
  onLogout,
  siteContent,
  onUpdateSiteContent,
  zones,
  onUpdateZonePosition,
  onSaveZonePositions,
  onResetZonePosition,
  onAddCustomZone,
  onDeleteCustomZone,
}) {
  const [activeZone, setActiveZone] = useState(null)
  const [showSiteBanner, setShowSiteBanner] = useState(true)
  const [adminZoneMenu, setAdminZoneMenu] = useState(null)
  const [editingZoneId, setEditingZoneId] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLayers, setShowLayers] = useState(false)
  const [showMapModes, setShowMapModes] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') return 320

    try {
      const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY))
      if (Number.isFinite(stored) && stored >= 260 && stored <= 480) {
        return stored
      }
    } catch {
      // Ignore storage errors.
    }

    return 320
  })
  const [toast, setToast] = useState(null)
  const [routeFrom, setRouteFrom] = useState('')
  const [routeTo, setRouteTo] = useState('')
  const [routePlan, setRoutePlan] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [mapMode, setMapMode] = useState('standard')
  const isAdmin = user.access === 'admin'

  const routeSummary = useMemo(() => {
    if (!routePlan) return null

    const guide = getRouteGuide(routePlan, zones)
    return {
      ...routePlan,
      guide,
      stepCount: guide.length,
      nextStop: guide[1] || guide[0] || null,
    }
  }, [routePlan, zones])

  useEffect(() => {
    setActiveZone(prev => {
      if (!prev) return prev
      return zones.find(zone => zone.id === prev.id) || prev
    })
  }, [zones])

  useEffect(() => {
    setShowSiteBanner(true)
    const timer = window.setTimeout(() => {
      setShowSiteBanner(false)
    }, 10000)

    return () => window.clearTimeout(timer)
  }, [siteContent.bannerTitle, siteContent.bannerBody])

  useEffect(() => {
    if (!routeFrom || !routeTo) return

    const origin = findCampusLocation(routeFrom, zones)
    const destination = findCampusLocation(routeTo, zones)
    if (!origin || !destination || origin.id === destination.id) return

    setRoutePlan(buildCampusRoute(origin, destination, zones))
  }, [zones, routeFrom, routeTo])

  const defaultLayers = useMemo(() => {
    const o = {}
    LAYER_CONFIG.forEach(l => { o[l.id] = l.defaultOn })
    return o
  }, [])

  const [layers, setLayers] = useState(defaultLayers)

  useEffect(() => {
    const h = () => { setShowUserMenu(false); setShowLayers(false); setShowMapModes(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  useEffect(() => {
    const h = () => { setAdminZoneMenu(null) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  useEffect(() => {
    const handleViewport = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false)
      }
    }

    handleViewport()
    window.addEventListener('resize', handleViewport)
    return () => window.removeEventListener('resize', handleViewport)
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth))
    } catch {
      // Ignore storage errors.
    }
  }, [sidebarWidth])

  const handleZoneClick = (zone) => {
    setActiveZone(zone)
    setAdminZoneMenu(null)
    setLayers(prev => (prev[zone.cat] ? prev : { ...prev, [zone.cat]: true }))
    setToast({ msg: zone.name, icon: getIconGlyphByKey(zone.iconKey) })
    setSidebarOpen(false)
  }

  const handleAdminPinClick = (zone) => {
    if (!isAdmin) {
      handleZoneClick(zone)
      return
    }

    setActiveZone(zone)
    setAdminZoneMenu(zone)
    setToast({ msg: zone.name, icon: getIconGlyphByKey(zone.iconKey) })
  }

  const handleEditZone = (zoneId) => {
    setEditingZoneId(zoneId)
    setToast({ msg: 'Arrastra el pin y luego guarda el cambio.', icon: '✎' })
  }

  const handleSaveZone = (zoneId) => {
    onSaveZonePositions()
    setEditingZoneId(null)
    setAdminZoneMenu(null)
    const zone = zones.find(item => item.id === zoneId)
    if (zone) {
      setToast({ msg: `${zone.name} guardado.`, icon: '✓' })
    }
  }

  const handleResetZone = (zoneId) => {
    onResetZonePosition(zoneId)
    setEditingZoneId(null)
    setAdminZoneMenu(null)
    const zone = zones.find(item => item.id === zoneId)
    if (zone) {
      setToast({ msg: `${zone.name} restablecido.`, icon: '↺' })
    }
  }

  const handleDeleteZone = (zoneId) => {
    const zone = zones.find(item => item.id === zoneId)
    if (!zone) return

    if (!zone.custom) {
      setToast({ msg: 'Solo puedes eliminar pines creados por el admin.', icon: '⚠️' })
      return
    }

    onDeleteCustomZone(zoneId)
    setEditingZoneId(null)
    setAdminZoneMenu(null)
    setActiveZone(null)
  }

  const handleAddZone = (zoneDraft) => {
    const created = onAddCustomZone(zoneDraft)
    if (!created) {
      setToast({ msg: 'No se pudo crear el pin.', icon: '⚠️' })
      return null
    }

    setActiveZone(created)
    setAdminZoneMenu(created)
    setEditingZoneId(created.id)
    setToast({ msg: `${created.name} creado.`, icon: '➕' })
    return created
  }

  const handleToggleLayer = (id) => {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSidebar = (event) => {
    event?.stopPropagation?.()

    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(prev => !prev)
      setShowUserMenu(false)
      setShowLayers(false)
      return
    }

    setSidebarCollapsed(prev => !prev)
    setSidebarOpen(false)
    setShowUserMenu(false)
    setShowLayers(false)
  }

  const syncRouteLayers = (origin, destination) => {
    setLayers(prev => ({
      ...prev,
      [origin.cat]: true,
      [destination.cat]: true,
    }))
  }

  const showRoute = (origin, destination) => {
    const route = buildCampusRoute(origin, destination, zones)
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
      msg: `Ruta lista: ${origin.name} -> ${destination.name}`,
      icon: '->',
    })
    return true
  }

  const handleCalculateRoute = () => {
    const origin = findCampusLocation(routeFrom, zones)
    const destination = findCampusLocation(routeTo, zones)

    if (!origin || !destination) {
      setRoutePlan(null)
      const msg = !origin && !destination
        ? 'Escribe un punto de inicio y un destino validos.'
        : !origin
          ? 'No reconozco el punto de inicio. Prueba con "Entrada Principal".'
          : 'No reconozco el destino. Prueba con "Bloque Principal".'
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
    const origin = findCampusLocation(routeFrom, zones) || findCampusLocation('Entrada Principal', zones) || activeZone || zone
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
    <div
      className={styles.app}
      style={{ '--sidebar-width': sidebarCollapsed ? '84px' : `${sidebarWidth}px` }}
      onClick={() => { setShowUserMenu(false); setShowLayers(false); setShowMapModes(false); setSidebarOpen(false) }}
    >
      <Topbar
        user={user}
        zones={zones}
        onSearch={handleZoneClick}
        layersOpen={showLayers}
        mapModesOpen={showMapModes}
        sidebarOpen={sidebarOpen || sidebarCollapsed}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onToggleSidebar={toggleSidebar}
        onToggleLayers={e => { e.stopPropagation(); setShowLayers(p => !p); setShowUserMenu(false); setShowMapModes(false) }}
        onToggleMapModes={e => { e.stopPropagation(); setShowMapModes(p => !p); setShowLayers(false); setShowUserMenu(false) }}
        onToggleUser={e => { e.stopPropagation(); setShowUserMenu(p => !p); setShowLayers(false); setShowMapModes(false) }}
      />

      {showSiteBanner && (
        <div className={`${styles.siteBanner} fade-in`}>
          <div className={styles.siteBannerInner}>
            <div className={styles.siteBannerTitle}>{siteContent.bannerTitle}</div>
            <div className={styles.siteBannerBody}>{siteContent.bannerBody}</div>
          </div>
        </div>
      )}

      <Sidebar
        zones={zones}
        activeZone={activeZone}
        onZoneClick={handleZoneClick}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        onResizeWidth={setSidebarWidth}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        routeFrom={routeFrom}
        routeTo={routeTo}
        onRouteFromChange={value => { setRouteFrom(value); setRouteError('') }}
        onRouteToChange={value => { setRouteTo(value); setRouteError('') }}
        onCalculateRoute={handleCalculateRoute}
        routeSummary={routeSummary}
        routeError={routeError}
        onClearRoute={handleClearRoute}
      />

      <div className={styles.mapWrapper} onClick={e => e.stopPropagation()}>
        {sidebarOpen && <div className={styles.mobileBackdrop} onClick={() => setSidebarOpen(false)} />}
        <Suspense fallback={<MapLoadingFallback />}>
          <CampusMap
            zones={zones}
            layers={layers}
            activeZone={activeZone}
            onZoneClick={handleZoneClick}
            onAdminPinClick={handleAdminPinClick}
            onToggleLayer={handleToggleLayer}
            onClearRoute={handleClearRoute}
            route={routePlan}
            routeSummary={routeSummary}
            mapMode={mapMode}
            theme={theme}
            user={user}
            onUpdateZonePosition={onUpdateZonePosition}
            editingZoneId={editingZoneId}
          />
        </Suspense>

        {showLayers && (
          <div className={styles.layerPanelAnchor} onClick={e => e.stopPropagation()}>
            <LayerPanel
              layers={layers}
              onToggle={handleToggleLayer}
              onClose={() => setShowLayers(false)}
            />
          </div>
        )}

        {showMapModes && (
          <div className={styles.mapModePanelAnchor} onClick={e => e.stopPropagation()}>
            <MapModePanel
              mode={mapMode}
              onChange={setMapMode}
              onClose={() => setShowMapModes(false)}
            />
          </div>
        )}

        {activeZone && (
          <InfoPanel
            zone={activeZone}
            onClose={() => setActiveZone(null)}
            onRouteHere={handleRouteHere}
          />
        )}

        {adminZoneMenu && isAdmin && (
          <div className={styles.adminZoneMenu} onClick={e => e.stopPropagation()}>
            <div className={styles.adminZoneHeader}>
              <div>
                <div className={styles.adminZoneTitle}>{adminZoneMenu.name}</div>
                <div className={styles.adminZoneSubtitle}>Opciones de administracion</div>
              </div>
              <button
                type="button"
                className={styles.adminZoneClose}
                onClick={() => setAdminZoneMenu(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.adminZoneActions}>
              <button
                type="button"
                className={styles.adminZoneButton}
                onClick={() => handleEditZone(adminZoneMenu.id)}
              >
                Editar
              </button>
              <button
                type="button"
                className={styles.adminZoneButton}
                onClick={() => handleSaveZone(adminZoneMenu.id)}
              >
                Guardar cambio
              </button>
              <button
                type="button"
                className={styles.adminZoneButton}
                onClick={() => handleResetZone(adminZoneMenu.id)}
              >
                Restablecer
              </button>
              <button
                type="button"
                className={`${styles.adminZoneButton} ${styles.adminZoneDelete}`}
                onClick={() => handleDeleteZone(adminZoneMenu.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      <StatusBar activeZone={activeZone} />

      {showUserMenu && (
        <UserMenu
          user={user}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onClose={() => setShowUserMenu(false)}
          onLogout={onLogout}
          siteContent={siteContent}
          onUpdateSiteContent={onUpdateSiteContent}
          onAddZone={handleAddZone}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} icon={toast.icon} onDone={() => setToast(null)} />
      )}
    </div>
  )
}


