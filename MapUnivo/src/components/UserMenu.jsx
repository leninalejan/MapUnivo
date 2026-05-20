import { useState } from 'react'
import { Icons } from './Icons.jsx'
import styles from './UserMenu.module.css'

export default function UserMenu({ user, theme, onToggleTheme, onClose }) {
  const [view, setView] = useState('menu')

  return (
    <div className={`${styles.menu} fade-in`} onClick={e => e.stopPropagation()}>
      {view === 'menu' && (
        <>
          <div className={styles.header}>
            <div className={styles.avatar}>{user.initials}</div>
            <div>
              <div className={styles.name}>{user.name}</div>
              <div className={styles.role}>{user.role}</div>
              <div className={styles.carnet}>{user.carnet}</div>
            </div>
          </div>

          <hr className={styles.divider} />

          <button className={styles.item} onClick={() => setView('perfil')}>
            <span className={styles.itemIcon}><Icons.User /></span>
            Mi perfil
          </button>

          <button className={styles.item} onClick={() => setView('config')}>
            <span className={styles.itemIcon}><Icons.Layers /></span>
            Configuracion
          </button>

          <button className={`${styles.item} ${styles.secondary}`} onClick={onClose}>
            Cerrar
          </button>
        </>
      )}

      {view === 'perfil' && (
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <button className={styles.backBtn} onClick={() => setView('menu')}>
              <Icons.Chevron /> Volver
            </button>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>{user.initials}</div>
            <div className={styles.profileName}>{user.name}</div>
            <div className={styles.profileRole}>{user.role}</div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Usuario</span>
              <span className={styles.infoValue}>{user.username}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Carnet</span>
              <span className={styles.infoValue}>{user.carnet}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Acceso</span>
              <span className={styles.infoValue}>Mapa institucional</span>
            </div>
          </div>
        </div>
      )}

      {view === 'config' && (
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <button className={styles.backBtn} onClick={() => setView('menu')}>
              <Icons.Chevron /> Volver
            </button>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>

          <div className={styles.sectionTitle}>Configuracion rapida</div>
          <div className={styles.settingCard}>
            <div className={styles.settingText}>
              <div className={styles.settingLabel}>Tema de la interfaz</div>
              <div className={styles.settingHint}>
                Cambia entre modo claro y oscuro para el mapa.
              </div>
            </div>
            <button className={styles.toggleThemeBtn} onClick={onToggleTheme}>
              {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Estado</span>
              <span className={styles.infoValue}>Sesion activa</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Notificaciones</span>
              <span className={styles.infoValue}>Disponibles en pantalla</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
