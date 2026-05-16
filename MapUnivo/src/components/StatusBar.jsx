import { useState, useEffect } from 'react'
import styles from './StatusBar.module.css'

export default function StatusBar({ activeZone }) {
  const [coords, setCoords] = useState('Lat: 13.3392° | Lng: -88.4420°')

  useEffect(() => {
    if (activeZone) {
      setCoords(`Lat: ${(activeZone.lat || 13.3392).toFixed(4)}° | Lng: ${(activeZone.lng || -88.4420).toFixed(4)}°`)
    }
  }, [activeZone])

  return (
    <div className={styles.bar}>
      <span>
        <span className={styles.dot} />
        UNIVO Maps v1.0 - Connected
      </span>
      <span>Universidad de Oriente - San Miguel, El Salvador</span>
      <span className={styles.coords}>{coords}</span>
    </div>
  )
}
