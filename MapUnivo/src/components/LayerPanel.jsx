// src/components/LayerPanel.jsx
import { LAYER_CONFIG } from '../data/campusData.js'
import styles from './LayerPanel.module.css'

export default function LayerPanel({ layers, onToggle, onClose }) {
  return (
    <div className={`${styles.panel} fade-in`} onClick={e => e.stopPropagation()}>
      <div className={styles.header}>
        <span>Capas del mapa</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      <div className={styles.body}>
        {LAYER_CONFIG.map(lc => (
          <div key={lc.id} className={styles.row} onClick={() => onToggle(lc.id)}>
            <div className={styles.swatch} style={{ background: lc.color }} />
            <span className={styles.label}>{lc.label}</span>
            <div className={`${styles.toggle} ${layers[lc.id] ? styles.on : ''}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
