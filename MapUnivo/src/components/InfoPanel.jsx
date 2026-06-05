import { Icons } from './Icons.jsx'
import styles from './InfoPanel.module.css'

export default function InfoPanel({ zone, onClose, onRouteHere }) {
  if (!zone) return null
  const hasPhone = /\d/.test(zone.tel || '')

  const handleShare = () => {
    navigator.clipboard?.writeText(`${zone.name} - MapUNIVO, Campus UNIVO`)
      .then(() => {})
      .catch(() => {})
  }

  return (
    <div className={`${styles.panel} pop-in`}>
      <button className={styles.close} onClick={onClose}>×</button>

      <div className={styles.badge} style={{ background: zone.color + '22', color: zone.color }}>
        {zone.badge}
      </div>

      <h2 className={styles.title}>{zone.icon} {zone.name}</h2>
      <p className={styles.desc}>{zone.desc}</p>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaIcon}><Icons.Clock /></span>
          <strong>{zone.horario}</strong>
        </div>
        {hasPhone && (
          <div className={styles.metaRow}>
            <span className={styles.metaIcon}><Icons.Phone /></span>
            <strong>{zone.tel}</strong>
          </div>
        )}
        <div className={styles.metaRow}>
          <span className={styles.metaIcon}><Icons.Pin /></span>
          <strong>Ciudad Universitaria - San Miguel</strong>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => {
            if (onRouteHere) {
              onRouteHere(zone)
              return
            }
            alert(`Calculando ruta hacia ${zone.name}...`)
          }}
        >
          <span className={styles.btnIco}><Icons.Goto /></span> Ir aquí
        </button>
        <button className={`${styles.btn} ${styles.secondary}`} onClick={handleShare}>
          <span className={styles.btnIco}><Icons.Share /></span> Compartir
        </button>
      </div>
    </div>
  )
}
