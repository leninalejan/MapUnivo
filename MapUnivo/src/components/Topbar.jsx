// src/components/Topbar.jsx
import { useState, useRef, useEffect, useMemo } from 'react'
import { CAMPUS_ZONES } from '../data/campusData.js'
import { Icons } from './Icons.jsx'
import styles from './Topbar.module.css'

function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const ref = useRef()

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return CAMPUS_ZONES.filter(z =>
      z.name.toLowerCase().includes(q) ||
      z.badge.toLowerCase().includes(q) ||
      z.cat.toLowerCase().includes(q)
    ).slice(0, 7)
  }, [query])

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className={styles.searchWrap} ref={ref}>
      <span className={styles.searchIcon}><Icons.Search /></span>
      <input
        className={styles.searchInput}
        placeholder="Buscar edificio, acceso, área..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className={styles.dropdown}>
          {results.map(z => (
            <div
              key={z.id}
              className={styles.dropItem}
              onClick={() => { onSelect(z); setQuery(''); setOpen(false) }}
            >
              <div className={styles.dropIcon} style={{ background: z.color + '22' }}>
                {z.icon}
              </div>
              <div className={styles.dropInfo}>
                <div className={styles.dropName}>{z.name}</div>
                <div className={styles.dropCat}>{z.cat.replace('_', ' ')}</div>
              </div>
              <span className={styles.dropBadge}>{z.badge}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Topbar({ user, onSearch, onToggleLayers, onToggleUser, onToggleSidebar, sidebarOpen, layersOpen, theme, onToggleTheme }) {
  return (
    <header className={styles.topbar}>
      <button
        className={`${styles.iconBtn} ${styles.menuBtn} ${sidebarOpen ? styles.active : ''}`}
        onClick={onToggleSidebar}
        title="Abrir menu"
        aria-label="Abrir menu"
      >
        <Icons.Menu />
      </button>

      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <img
            src="https://www.univo.edu.sv/wp-content/uploads/2022/01/LOGOESCUDO.png"
            alt="Universidad de Oriente"
          />
        </div>
        <span className={styles.brandName}>
          <span>Map</span>UNIVO
        </span>
      </div>

      {/* Search */}
      <SearchBar onSelect={onSearch} />

      {/* Right actions */}
      <div className={styles.right}>
        <button
          className={styles.iconBtn}
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
        </button>

        <button
          className={`${styles.iconBtn} ${layersOpen ? styles.active : ''}`}
          onClick={onToggleLayers}
          title="Capas del mapa"
        >
          <Icons.Layers />
        </button>

        <div className={styles.userPill} onClick={onToggleUser}>
          <div className={styles.avatar}>{user.initials}</div>
          <span className={styles.userName}>{user.name.split(' ')[0]}</span>
          <span className={styles.chevron}><Icons.Chevron /></span>
        </div>
      </div>
    </header>
  )
}
