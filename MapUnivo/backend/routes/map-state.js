const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { isDatabaseUnavailable } = require('../lib/dbErrors')

const DEFAULT_MAP_STATE = {
  siteContent: {
    bannerTitle: 'Bienvenido a MapUNIVO',
    bannerBody: 'Consulta el campus, ubica zonas y, si eres administrador, actualiza este mensaje desde el menu de usuario.',
  },
  zonePositions: {},
  customZones: [],
}

let initPromise = null

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeState(rawState) {
  const state = isPlainObject(rawState) ? rawState : {}

  return {
    siteContent: {
      ...DEFAULT_MAP_STATE.siteContent,
      ...(isPlainObject(state.siteContent) ? state.siteContent : {}),
    },
    zonePositions: isPlainObject(state.zonePositions) ? state.zonePositions : {},
    customZones: Array.isArray(state.customZones) ? state.customZones : [],
  }
}

async function ensureTable() {
  if (!initPromise) {
    initPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)

      await pool.query(
        `INSERT INTO app_state (key, value)
         VALUES ('map_state', $1::jsonb)
         ON CONFLICT (key) DO NOTHING`,
        [JSON.stringify(DEFAULT_MAP_STATE)]
      )
    })()
  }

  return initPromise
}

router.get('/', async (_req, res) => {
  try {
    await ensureTable()

    const { rows } = await pool.query(
      'SELECT value, updated_at FROM app_state WHERE key=$1 LIMIT 1',
      ['map_state']
    )

    if (!rows[0]) {
      return res.json({ ...DEFAULT_MAP_STATE, updatedAt: new Date().toISOString() })
    }

    const normalized = normalizeState(rows[0].value)
    return res.json({
      ...normalized,
      updatedAt: rows[0].updated_at,
    })
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'Base de datos no disponible' })
    }
    console.error('[MapUnivo] Error leyendo estado del mapa:', err)
    return res.status(500).json({ error: 'Error del servidor' })
  }
})

router.put('/', async (req, res) => {
  try {
    await ensureTable()

    const nextState = normalizeState(req.body)

    const { rows } = await pool.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ('map_state', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()
       RETURNING updated_at`,
      [JSON.stringify(nextState)]
    )

    return res.json({
      ...nextState,
      updatedAt: rows[0]?.updated_at || new Date().toISOString(),
    })
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'Base de datos no disponible' })
    }
    console.error('[MapUnivo] Error guardando estado del mapa:', err)
    return res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
