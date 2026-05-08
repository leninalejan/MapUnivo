// src/components/UserMenu.jsx
import styles from './UserMenu.module.css'

export default function UserMenu({ user, onLogout, onClose }) {
  return (
    <div className={`${styles.menu} fade-in`} onClick={e => e.stopPropagation()}>
      <div className={styles.header}>
        <div className={styles.avatar}>{user.initials}</div>
        <div>
          <div className={styles.name}>{user.name}</div>
          <div className={styles.role}>{user.role}</div>
          <div className={styles.carnet}>{user.carnet}</div>
        </div>
      </div>
      <hr className={styles.divider} />
      <button className={styles.item} onClick={() => { alert(`Carné: ${user.carnet}`); onClose() }}>
        👤 Mi Perfil
      </button>
      <button className={styles.item} onClick={() => { alert('Configuración en desarrollo'); onClose() }}>
        ⚙️ Configuración
      </button>
      <hr className={styles.divider} />
      <button className={`${styles.item} ${styles.danger}`} onClick={onLogout}>
        🚪 Cerrar sesión
      </button>
    </div>
  )
}
