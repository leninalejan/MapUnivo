// src/components/LoginScreen.jsx
import { useState } from 'react'
import { DEMO_USERS } from '../data/campusData.js'
import { Icons } from './Icons.jsx'
import styles from './LoginScreen.module.css'

export default function LoginScreen({ onLogin, theme, onToggleTheme }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const user = DEMO_USERS.find(u =>
        (u.username === username.toLowerCase() || username.toLowerCase().includes(u.username)) &&
        u.password === password
      )
      if (user) {
        onLogin(user)
      } else {
        setError('Usuario o contraseña incorrectos')
        setLoading(false)
      }
    }, 700)
  }

  const fillDemo = (u) => { setUsername(u.username); setPassword(u.password); setError('') }

  return (
    <div className={styles.screen}>
      <button
        type="button"
        className={styles.themeBtn}
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
      </button>

      {/* Animated background */}
      <div className={styles.bg}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={styles.grid} />
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <img
              src="https://www.univo.edu.sv/wp-content/uploads/2022/01/LOGOESCUDO.png"
              alt="Universidad de Oriente"
            />
          </div>
          <div>
            <span className={styles.logoName}>MapUNIVO</span>
            <span className={styles.logoSub}>Campus Navigator</span>
          </div>
        </div>

        <h1 className={styles.title}>Acceso institucional</h1>
        <p className={styles.subtitle}>
          Accede al mapa interactivo de la Universidad de Oriente en San Miguel
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Usuario MapUNIVO</label>
            <div className={styles.field}>
              <span className={styles.fieldIcon}><Icons.User /></span>
              <input
                type="text"
                placeholder="usuario@univo.edu.sv"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.field}>
              <span className={styles.fieldIcon}><Icons.Lock /></span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}><Icons.Warn /></span>
              {error}
            </div>
          )}

          <button type="submit" className={styles.btnLogin} disabled={loading}>
            {loading
              ? <span className={styles.spinner}>⟳</span>
              : <><span>Ingresar al campus</span><span className={styles.btnArrow}><Icons.Arrow /></span></>
            }
          </button>
        </form>

        <div className={styles.hint}>
          <span>Cuentas de prueba del campus:</span>
          <div className={styles.chips}>
            {DEMO_USERS.map(u => (
              <button key={u.username} className={styles.chip} onClick={() => fillDemo(u)}>
                {u.username} / {u.password}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
