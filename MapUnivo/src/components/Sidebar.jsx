import { useEffect, useMemo, useRef } from 'react'
import { CAMPUS_ZONES, LAYER_CONFIG, CAT_LABELS } from '../data/campusData.js'
import { getIconGlyphByKey } from '../data/iconOptions.js'
import { Icons } from './Icons.jsx'
import styles from './Sidebar.module.css'

export default function Sidebar({
  zones = CAMPUS_ZONES,
  activeZone,
  onZoneClick,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  onResizeWidth,
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
    zones.forEach(z => {
      if (!g[z.cat]) g[z.cat] = []
      g[z.cat].push(z)
    })
    return g
  }, [zones])

  const quickZones = useMemo(() => {
    const ids = ['entrada_principal', 'entrada_panamericana', 'bloque_principal', 'area_dos']
    return ids.map(id => zones.find(zone => zone.id === id)).filter(Boolean)
  }, [zones])

  const parkingZones = useMemo(() => {
    return (grouped.estacionamiento || []).slice()
  }, [grouped])

  const visibleLayerCount = Object.values(layers).filter(Boolean).length
  const resizeHandleRef = useRef(null)
  const dragStateRef = useRef(null)
  const dragCleanupRef = useRef(() => {})

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.()
    }
  }, [])

  const handleResizeStart = (event) => {
    if (collapsed) return
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return

    event.preventDefault()
    event.stopPropagation()

    dragStateRef.current = {
      startX: event.clientX,
      startWidth: resizeHandleRef.current?.parentElement?.getBoundingClientRect().width || 320,
    }

    const handlePointerMove = (moveEvent) => {
      const state = dragStateRef.current
      if (!state) return

      const delta = moveEvent.clientX - state.startX
      const nextWidth = Math.max(260, Math.min(480, Math.round(state.startWidth + delta)))
      onResizeWidth?.(nextWidth)
    }

    const finishDrag = () => {
      dragStateRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
      dragCleanupRef.current = () => {}
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishDrag, { once: true })
    window.addEventListener('pointercancel', finishDrag, { once: true })
    dragCleanupRef.current = finishDrag
  }

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''} ${collapsed ? styles.collapsed : ''}`} onClick={e => e.stopPropagation()}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrand}>
          <span className={styles.sidebarBrandMark}>MapUNIVO</span>
          <span className={styles.sidebarBrandText}>Mapa</span>
        </div>

        <div className={styles.sidebarActions}>
          <button
            className={styles.collapseBtn}
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menu' : 'Contraer menu'}
            title={collapsed ? 'Expandir menu' : 'Contraer menu'}
          >
            <span className={collapsed ? styles.collapseIconFlip : ''}><Icons.Chevron /></span>
          </button>
          <button className={styles.mobileClose} type="button" onClick={onClose} aria-label="Cerrar menu">
            Cerrar
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className={styles.collapsedDock}>
          <div className={styles.collapsedSummary}>
            <div className={styles.collapsedSummaryTop}>
              <span className={styles.collapsedBrand}>MapUNIVO</span>
              <span className={styles.collapsedMode}>Compacto</span>
            </div>

            <div className={styles.collapsedStats}>
              <div className={styles.collapsedStat}>
                <span className={styles.collapsedStatValue}>{visibleLayerCount}</span>
                <span className={styles.collapsedStatLabel}>Capas</span>
              </div>
              <div className={styles.collapsedStat}>
                <span className={styles.collapsedStatValue}>{routeSummary ? routeSummary.stepCount : 0}</span>
                <span className={styles.collapsedStatLabel}>Ruta</span>
              </div>
            </div>

            <button type="button" className={styles.collapsedPrimary} onClick={onToggleCollapse} title="Abrir panel completo">
              <Icons.Menu />
              <span>Abrir panel</span>
            </button>
          </div>

          <div className={styles.collapsedQuickLabel}>Acceso rapido</div>
          <div className={styles.collapsedLayerLabel}>Capas</div>
          <div className={styles.collapsedLayerGrid}>
            {LAYER_CONFIG.map(layer => {
              const active = !!layers[layer.id]
              return (
                <button
                  key={layer.id}
                  type="button"
                  className={`${styles.collapsedLayerBtn} ${active ? styles.collapsedLayerBtnOn : ''}`}
                  onClick={() => onToggleLayer(layer.id)}
                  title={active ? `Ocultar ${layer.label}` : `Mostrar ${layer.label}`}
                >
                  <span className={styles.collapsedLayerDot} style={{ background: layer.color }} />
                  <span className={styles.collapsedLayerText}>{layer.label}</span>
                </button>
              )
            })}
          </div>
          <div className={styles.collapsedQuickGrid}>
            <button
              type="button"
              className={styles.dockBtn}
              onClick={() => onZoneClick(activeZone || zones[0])}
              title="Ir a la zona activa"
            >
              <span className={styles.dockBtnIcon}><Icons.Pin /></span>
              <span className={styles.dockBtnText}>Activo</span>
            </button>

            {parkingZones.slice(0, 3).map(zone => (
              <button
                key={zone.id}
                type="button"
                className={styles.dockBtn}
                onClick={() => onZoneClick(zone)}
                title={zone.name}
              >
                <span className={styles.dockBtnIcon} style={{ color: zone.color }}>{getIconGlyphByKey(zone.iconKey)}</span>
                <span className={styles.dockBtnText}>{zone.name}</span>
              </button>
            ))}
          </div>

          {routeSummary && (
            <button
              type="button"
              className={styles.collapsedRouteCard}
              onClick={onToggleCollapse}
              title="Abrir para ver la ruta completa"
            >
              <span className={styles.collapsedRouteLabel}>Ruta activa</span>
              <span className={styles.collapsedRoutePath}>
                {routeSummary.origin.name}{' \u2192 '}{routeSummary.destination.name}
              </span>
              <span className={styles.collapsedRouteMeta}>
                {routeSummary.durationMinutes} min · {routeSummary.distanceMeters} m
              </span>
            </button>
          )}

          <div className={styles.collapsedHint}>
            Toca o expande para ver el panel completo
          </div>
        </div>
          ) : (
        <>
          {parkingZones.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Parqueos directos</div>
              <div className={styles.zoneList}>
                {parkingZones.map(z => (
                  <button
                    key={z.id}
                    type="button"
                    className={`${styles.zoneItem} ${activeZone?.id === z.id ? styles.active : ''}`}
                    onClick={() => onZoneClick(z)}
                    title={z.name}
                  >
                    <div className={styles.zoneIcon}>{getIconGlyphByKey(z.iconKey)}</div>
                    <div className={styles.zoneDot} style={{ background: z.color }} />
                    <span className={styles.zoneName}>{z.name}</span>
                    <span className={styles.zoneBadge}>{z.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([cat, zones]) => (
            <div className={styles.section} key={cat}>
              <div className={styles.sectionTitle}>{CAT_LABELS[cat] || cat}</div>
              <div className={styles.zoneList}>
                {zones.map(z => (
                  <div
                    key={z.id}
                    className={`${styles.zoneItem} ${activeZone?.id === z.id ? styles.active : ''}`}
                    onClick={() => onZoneClick(z)}
                    title={z.name}
                  >
                    <div className={styles.zoneIcon}>{getIconGlyphByKey(z.iconKey)}</div>
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

            {routeSummary && (
              <div className={styles.routeLive}>
                <div className={styles.routeLiveHeader}>
                  <span className={styles.routeLivePill}>Modo navegacion</span>
                  <span className={styles.routeLiveMeta}>
                    {routeSummary.stepCount} nodos - {routeSummary.distanceMeters} m
                  </span>
                </div>
                <div className={styles.routeLivePath}>
                  {routeSummary.origin.name}{' \u2192 '}{routeSummary.destination.name}
                </div>
                <div className={styles.routeLiveStats}>
                  <span><span className={styles.routeSummaryIcon}><Icons.Clock /></span>{routeSummary.durationMinutes} min aprox.</span>
                  <span><span className={styles.routeSummaryIcon}><Icons.Goto /></span>
                    {routeSummary.nextStop ? `Siguiente: ${routeSummary.nextStop.label}` : 'Ruta lista'}
                  </span>
                </div>

                <div className={styles.routeStepList}>
                  {(routeSummary.guide || []).map(step => (
                    <div
                      key={`${step.id}-${step.index}`}
                      className={`${styles.routeStep} ${step.isStart ? styles.routeStepStart : ''} ${step.isEnd ? styles.routeStepEnd : ''}`}
                    >
                      <div className={styles.routeStepIndex}>{step.index + 1}</div>
                      <div className={styles.routeStepBody}>
                        <div className={styles.routeStepLabel}>{step.label}</div>
                        <div className={styles.routeStepMeta}>
                          <span className={styles.routeStepTag} style={{ background: step.color + '22', color: step.color }}>
                            {step.tag}
                          </span>
                          {step.isStart && <span className={styles.routeStepFlag}>Inicio</span>}
                          {step.isEnd && <span className={styles.routeStepFlag}>Destino</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className={styles.routeClear} onClick={onClearRoute}>
                  <span className={styles.routeSummaryIcon}><Icons.Reset /></span>
                  Limpiar ruta
                </button>
              </div>
            )}

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
                {zones.map(z => (
                  <option key={z.id} value={z.name} />
                ))}
              </datalist>

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
        </>
      )}
      {!collapsed && (
        <button
          ref={resizeHandleRef}
          type="button"
          className={styles.resizeHandle}
          onPointerDown={handleResizeStart}
          aria-label="Ajustar ancho del panel"
          title="Arrastra para ajustar el ancho"
        />
      )}
    </aside>
  )
}
