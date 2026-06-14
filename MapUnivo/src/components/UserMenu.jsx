import { useEffect, useState } from 'react'
import { Icons } from './Icons.jsx'
import { ICON_OPTIONS } from '../data/iconOptions.js'
import styles from './UserMenu.module.css'

export default function UserMenu({
  user,
  theme,
  onToggleTheme,
  onClose,
  onLogout,
  siteContent,
  onUpdateSiteContent,
  onAddZone,
}) {
  const [view, setView] = useState('menu')
  const [draftTitle, setDraftTitle] = useState(siteContent?.bannerTitle || '')
  const [draftBody, setDraftBody] = useState(siteContent?.bannerBody || '')
  const [pinName, setPinName] = useState('')
  const [pinBadge, setPinBadge] = useState('NUEVO')
  const [pinCategory, setPinCategory] = useState('servicios')
  const [pinColor, setPinColor] = useState('#0F5EA8')
  const [pinIconKey, setPinIconKey] = useState('Pin')
  const [pinDescription, setPinDescription] = useState('')

  const isAdmin = user.access === 'admin'

  useEffect(() => {
    if (view === 'admin') {
      setDraftTitle(siteContent?.bannerTitle || '')
      setDraftBody(siteContent?.bannerBody || '')
    }
  }, [siteContent, view])

  const openAdmin = () => {
    setDraftTitle(siteContent?.bannerTitle || '')
    setDraftBody(siteContent?.bannerBody || '')
    setView('admin')
  }

  const openNewPin = () => {
    setPinName('')
    setPinBadge('NUEVO')
    setPinCategory('servicios')
    setPinColor('#0F5EA8')
    setPinIconKey('Pin')
    setPinDescription('')
    setView('newPin')
  }

  const handleSaveSite = (e) => {
    e.preventDefault()
    onUpdateSiteContent({
      bannerTitle: draftTitle.trim(),
      bannerBody: draftBody.trim(),
    })
    setView('menu')
  }

  const handleCreatePin = (e) => {
    e.preventDefault()
    const created = onAddZone?.({
      name: pinName.trim(),
      badge: pinBadge.trim(),
      cat: pinCategory,
      color: pinColor,
      iconKey: pinIconKey,
      desc: pinDescription.trim(),
      px: 50,
      py: 50,
    })

    if (created) {
      setView('menu')
      onClose?.()
    }
  }

  return (
    <div className={`${styles.menu} fade-in`} onClick={e => e.stopPropagation()}>
      {view === 'menu' && (
        <>
          <div className={styles.header}>
            <div className={styles.avatar}>{user.initials}</div>
            <div>
              <div className={styles.name}>{user.name}</div>
              <div className={styles.role}>
                {user.role} · {user.access === 'admin' ? 'Admin' : 'Normal'}
              </div>
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
            Configuración
          </button>

          {isAdmin && (
            <button className={styles.item} onClick={openAdmin}>
              <span className={styles.itemIcon}><Icons.Eye /></span>
              Editar web
            </button>
          )}

          {isAdmin && (
            <button className={styles.item} onClick={openNewPin}>
              <span className={styles.itemIcon}><Icons.Plus /></span>
              Agregar pin
            </button>
          )}

          <button className={styles.item} onClick={onLogout}>
            <span className={styles.itemIcon}><Icons.Reset /></span>
            Cerrar sesión
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
              <span className={styles.infoValue}>{user.access === 'admin' ? 'Administrador' : 'Normal'}</span>
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

          <div className={styles.sectionTitle}>Configuración rápida</div>
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
              <span className={styles.infoValue}>Sesión activa</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Notificaciones</span>
              <span className={styles.infoValue}>Disponibles en pantalla</span>
            </div>
          </div>
        </div>
      )}

      {view === 'admin' && isAdmin && (
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <button className={styles.backBtn} onClick={() => setView('menu')}>
              <Icons.Chevron /> Volver
            </button>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>

          <div className={styles.sectionTitle}>Editor de web</div>
          <form className={styles.adminForm} onSubmit={handleSaveSite}>
            <label className={styles.adminField}>
              <span>Título del banner</span>
              <input
                type="text"
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                placeholder="Bienvenido a MapUNIVO"
              />
            </label>

            <label className={styles.adminField}>
              <span>Mensaje del banner</span>
              <textarea
                rows="4"
                value={draftBody}
                onChange={e => setDraftBody(e.target.value)}
                placeholder="Actualiza este mensaje para toda la comunidad."
              />
            </label>

            <div className={styles.adminHint}>
              Estos cambios se guardan en tu sesión local y se ven en la interfaz del mapa.
            </div>

            <button type="submit" className={styles.adminSave}>
              Guardar cambios
            </button>
          </form>

          <div className={styles.adminSectionDivider} />

          <button type="button" className={styles.adminAltButton} onClick={openNewPin}>
            Agregar pin nuevo
          </button>
        </div>
      )}

      {view === 'newPin' && isAdmin && (
        <div className={styles.section}>
          <div className={styles.sectionTop}>
            <button className={styles.backBtn} onClick={() => setView('menu')}>
              <Icons.Chevron /> Volver
            </button>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>

          <div className={styles.sectionTitle}>Nuevo pin funcional</div>
          <form className={styles.adminForm} onSubmit={handleCreatePin}>
            <label className={styles.adminField}>
              <span>Nombre</span>
              <input
                type="text"
                value={pinName}
                onChange={e => setPinName(e.target.value)}
                placeholder="Nombre del lugar"
                required
              />
            </label>

            <label className={styles.adminField}>
              <span>Etiqueta</span>
              <input
                type="text"
                value={pinBadge}
                onChange={e => setPinBadge(e.target.value)}
                placeholder="NUEVO"
              />
            </label>

            <label className={styles.adminField}>
              <span>Categoría</span>
              <select value={pinCategory} onChange={e => setPinCategory(e.target.value)}>
                <option value="edificios">Edificios</option>
                <option value="servicios">Servicios</option>
                <option value="areas_verdes">Áreas verdes</option>
                <option value="estacionamiento">Parqueos</option>
                <option value="accesos">Accesos</option>
              </select>
            </label>

            <label className={styles.adminField}>
              <span>Color</span>
              <input
                type="color"
                value={pinColor}
                onChange={e => setPinColor(e.target.value)}
              />
            </label>

            <label className={styles.adminField}>
              <span>Descripción</span>
              <textarea
                rows="3"
                value={pinDescription}
                onChange={e => setPinDescription(e.target.value)}
                placeholder="Descripción corta del lugar"
              />
            </label>

            <div className={styles.iconPickerLabel}>Elige un icono</div>
            <div className={styles.iconGrid}>
              {ICON_OPTIONS.map(option => {
                const IconComponent = Icons[option.key] || Icons.Pin
                const active = pinIconKey === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`${styles.iconCard} ${active ? styles.iconCardActive : ''}`}
                    onClick={() => setPinIconKey(option.key)}
                    title={option.label}
                    aria-label={option.label}
                  >
                    <span className={styles.iconCardSymbol}><IconComponent /></span>
                    <span className={styles.iconCardGlyph}>{option.glyph}</span>
                    <span className={styles.iconCardLabel}>{option.label}</span>
                  </button>
                )
              })}
            </div>

            <div className={styles.adminHint}>
              El pin se crea en el centro del mapa. Luego lo puedes arrastrar para ubicarlo mejor.
            </div>

            <button type="submit" className={styles.adminSave}>
              Crear pin
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
