import { useMemo } from 'react'
import { CAMPUS_ZONES, LAYER_CONFIG, CAT_LABELS } from '../data/campusData.js'
import { Icons } from './Icons.jsx'
import styles from './Sidebar.module.css'

export default function Sidebar({
  activeZone,
  onZoneClick,
  open,
  onClose,
  layers,
  onToggleLayer,
  routeFrom,
  routeTo,
  onRouteFromChange,
  onRouteToChange,
  onCalculateRoute,
  routeSummary,
  routeError,
  onClearRoute,
}) {
  const grouped = useMemo(() => {
    const g = {}
    CAMPUS_ZONES.forEach(z => {
      if (!g[z.cat]) g[z.cat] = []
      g[z.cat].push(z)
    })
    return g
  }, [])

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} onClick={e => e.stopPropagation()}>
      <button className={styles.mobileClose} type="button" onClick={onClose} aria-label="Cerrar menu">
        Cerrar
      </button>
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

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.titleIcon}><Icons.Route /></span> Mi Ruta
        </div>

        <form className={styles.routePanel} onSubmit={e => {
          e.preventDefault()
          onCalculateRoute()
        }}>
          <div className={styles.routeRow}>
            <div className={`${styles.routeDot} ${styles.start}`} />
            <input
              list="campus-route-points"
              placeholder="Punto de inicio..."
              value={routeFrom}
              onChange={e => onRouteFromChange(e.target.value)}
            />
          </div>

          <div className={styles.routeRow}>
            <div className={`${styles.routeDot} ${styles.end}`} />
            <input
              list="campus-route-points"
              placeholder="Destino..."
              value={routeTo}
              onChange={e => onRouteToChange(e.target.value)}
            />
          </div>

          <button className={styles.btnRoute} type="submit">
            <span className={styles.btnRouteIcon}><Icons.Goto /></span>
            Calcular ruta
          </button>

          <datalist id="campus-route-points">
            {CAMPUS_ZONES.map(z => (
              <option key={z.id} value={z.name} />
            ))}
          </datalist>

          {routeSummary && (
            <div className={styles.routeSummary}>
              <div className={styles.routeSummaryTitle}>
                <span className={styles.titleIcon}><Icons.Route /></span>
                Ruta activa
              </div>
              <div className={styles.routeSummaryPath}>
                {routeSummary.origin.name}{' \u2192 '}{routeSummary.destination.name}
              </div>
              <div className={styles.routeSummaryMeta}>
                <span><span className={styles.routeSummaryIcon}><Icons.Route /></span>{routeSummary.distanceMeters} m aprox.</span>
                <span><span className={styles.routeSummaryIcon}><Icons.Clock /></span>{routeSummary.durationMinutes} min aprox.</span>
              </div>
              <button type="button" className={styles.routeClear} onClick={onClearRoute}>
                <span className={styles.routeSummaryIcon}><Icons.Reset /></span>
                Limpiar ruta
              </button>
            </div>
          )}

          {routeError && (
            <div className={styles.routeError}>{routeError}</div>
          )}
        </form>
      </div>

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
