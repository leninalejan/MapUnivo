// src/components/Sidebar.jsx
import { useState, useMemo } from 'react'
import { CAMPUS_ZONES, LAYER_CONFIG, CAT_LABELS } from '../data/campusData.js'
import { Icons } from './Icons.jsx'
import styles from './Sidebar.module.css'

export default function Sidebar({ activeZone, onZoneClick, layers, onToggleLayer }) {
  const [routeFrom, setRouteFrom] = useState('')
  const [routeTo,   setRouteTo]   = useState('')

  const grouped = useMemo(() => {
    const g = {}
    CAMPUS_ZONES.forEach(z => {
      if (!g[z.cat]) g[z.cat] = []
      g[z.cat].push(z)
    })
    return g
  }, [])

  return (
    <aside className={styles.sidebar}>

      {/* Zone list grouped by category */}
      {Object.entries(grouped).map(([cat, zones]) => (
        <div className={styles.section} key={cat}>
          <div className={styles.sectionTitle}>{CAT_LABELS[cat] || cat}</div>
          <div className={styles.zoneList}>
            {zones.map(z => (
              <div
                key={z.id}
                className={`${styles.zoneItem} ${activeZone?.id === z.id ? styles.active : ''}`}
                onClick={() => onZoneClick(z)}
              >
                <div className={styles.zoneDot} style={{ background: z.color }} />
                <span className={styles.zoneName}>{z.name}</span>
                <span className={styles.zoneBadge}>{z.badge}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Route planner */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.titleIcon}><Icons.Route /></span> Mi Ruta
        </div>
        <div className={styles.routePanel}>
          <div className={styles.routeRow}>
            <div className={`${styles.routeDot} ${styles.start}`} />
            <input
              placeholder="Punto de inicio…"
              value={routeFrom}
              onChange={e => setRouteFrom(e.target.value)}
            />
          </div>
          <div className={styles.routeRow}>
            <div className={`${styles.routeDot} ${styles.end}`} />
            <input
              placeholder="Destino…"
              value={routeTo}
              onChange={e => setRouteTo(e.target.value)}
            />
          </div>
          <button
            className={styles.btnRoute}
            onClick={() => alert('Las rutas detalladas estarán disponibles con el plano de salones.')}
          >
            <span className={styles.btnRouteIcon}><Icons.Goto /></span>
            Calcular ruta
          </button>
        </div>
      </div>

      {/* Layer toggles */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.titleIcon}><Icons.Layers /></span> Capas visibles
        </div>
        <div className={styles.layerList}>
          {LAYER_CONFIG.map(lc => (
            <div key={lc.id} className={styles.layerRow} onClick={() => onToggleLayer(lc.id)}>
              <div className={styles.layerSwatch} style={{ background: lc.color }} />
              <span className={styles.layerLabel}>{lc.label}</span>
              <div className={`${styles.toggle} ${layers[lc.id] ? styles.on : ''}`} />
            </div>
          ))}
        </div>
      </div>

    </aside>
  )
}
