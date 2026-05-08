// src/components/Toast.jsx
import { useEffect } from 'react'
import styles from './Toast.module.css'

export default function Toast({ msg, icon, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={`${styles.toast} pop-in`}>
        <span className={styles.icon}>{icon}</span>
        {msg}
      </div>
    </div>
  )
}
