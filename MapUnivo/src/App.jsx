// src/App.jsx
import { useState, useEffect, useMemo } from 'react'
import LoginScreen from './components/LoginScreen.jsx'
import Topbar      from './components/Topbar.jsx'
import Sidebar     from './components/Sidebar.jsx'
import CampusMap   from './components/CampusMap.jsx'
import InfoPanel   from './components/InfoPanel.jsx'
import LayerPanel  from './components/LayerPanel.jsx'
import UserMenu    from './components/UserMenu.jsx'
import StatusBar   from './components/StatusBar.jsx'
import Toast       from './components/Toast.jsx'
import { CAMPUS_ZONES, LAYER_CONFIG } from './data/campusData.js'
import styles from './App.module.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem('mapunivo-theme')
      || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('mapunivo-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} theme={theme} onToggleTheme={toggleTheme} />
  }

  return <MainApp user={user} onLogout={() => setUser(null)} theme={theme} onToggleTheme={toggleTheme} />
}

// ─── Main application shell ───────────────────────────────────────────────────
function MainApp({ user, onLogout, theme, onToggleTheme }) {
  const [activeZone,   setActiveZone]   = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLayers,   setShowLayers]   = useState(false)
  const [toast,        setToast]        = useState(null)

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
    setToast({ msg: zone.name, icon: zone.icon })
  }

  const handleToggleLayer = (id) => {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleLogout = () => {
    setShowUserMenu(false)
    onLogout()
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
      />

      {/* ── Map area ── */}
      <div className={styles.mapWrapper} onClick={e => e.stopPropagation()}>
        <CampusMap
          zones={CAMPUS_ZONES}
          layers={layers}
          activeZone={activeZone}
          onZoneClick={handleZoneClick}
        />

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
          <InfoPanel zone={activeZone} onClose={() => setActiveZone(null)} />
        )}
      </div>

      {/* ── Status bar ── */}
      <StatusBar activeZone={activeZone} />

      {/* ── User dropdown (portal-like, fixed position) ── */}
      {showUserMenu && (
        <UserMenu
          user={user}
          onLogout={handleLogout}
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
