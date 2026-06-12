import styles from './MapModePanel.module.css'

const MODES = [
  {
    id: 'standard',
    title: 'Estándar',
    description: 'Plano limpio y claro para navegar.',
  },
  {
    id: 'satellite',
    title: 'Satélite',
    description: 'Más contraste y apariencia aérea.',
  },
]

export default function MapModePanel({ mode, onChange, onClose }) {
  return (
    <div className={`${styles.panel} fade-in`} onClick={e => e.stopPropagation()}>
      <div className={styles.header}>
        <span>Modo del mapa</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modos">
          ×
        </button>
      </div>

      <div className={styles.body}>
        {MODES.map(item => {
          const active = mode === item.id

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.row} ${active ? styles.active : ''}`}
              onClick={() => onChange(item.id)}
            >
              <span className={styles.content}>
                <span className={styles.label}>{item.title}</span>
                <span className={styles.desc}>{item.description}</span>
              </span>
              <span className={`${styles.pill} ${active ? styles.pillActive : ''}`}>
                {active ? 'Activo' : 'Usar'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
