// backend/server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const pool = require('./db/pool')

const app = express()
const PORT = process.env.PORT || 3001

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const allowedOrigins = new Set([
  ...defaultOrigins,
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.FRONTEND_URLS),
])

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
}))
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/zonas', require('./routes/zonas'))
app.use('/api/salones', require('./routes/salones'))
app.use('/api/map-state', require('./routes/map-state'))

app.get('/api/health', async (_, res) => {
  const health = {
    status: 'ok',
    project: 'MapUnivo',
    ts: new Date().toISOString(),
    config: {
      databaseUrl: Boolean(process.env.DATABASE_URL),
      jwtSecret: Boolean(process.env.JWT_SECRET),
      allowedOrigins: [...allowedOrigins],
    },
  }

  try {
    await pool.query('SELECT 1')
    health.database = 'ok'
    return res.json(health)
  } catch {
    health.status = 'degraded'
    health.database = 'unavailable'
    health.error = 'No se pudo conectar a PostgreSQL'
    return res.status(503).json(health)
  }
})

app.listen(PORT, () => console.log(`✅  MapUnivo API → http://localhost:${PORT}`))
