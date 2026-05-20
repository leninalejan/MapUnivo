// backend/routes/salones.js
const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const authJWT = require('../middleware/authJWT')
const { isDatabaseUnavailable } = require('../lib/dbErrors')

router.get('/', authJWT, async (req, res) => {
  try {
    const { tipo, piso } = req.query
    let q = 'SELECT s.*,z.nombre AS zona_nombre,z.slug AS zona_slug FROM salones s JOIN zonas z ON z.id=s.zona_id WHERE s.activo=TRUE'
    const params = []

    if (tipo) {
      params.push(tipo)
      q += ` AND s.tipo=$${params.length}`
    }

    if (piso) {
      params.push(piso)
      q += ` AND s.piso=$${params.length}`
    }

    q += ' ORDER BY s.piso,s.codigo'
    const { rows } = await pool.query(q, params)
    res.json(rows)
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'Base de datos no disponible' })
    }
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.get('/:codigo', authJWT, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT s.*,z.nombre AS zona_nombre,z.slug AS zona_slug FROM salones s JOIN zonas z ON z.id=s.zona_id WHERE s.codigo=$1 AND s.activo=TRUE',
      [req.params.codigo.toUpperCase()]
    )

    if (!rows[0]) return res.status(404).json({ error: 'Salon no encontrado' })
    res.json(rows[0])
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'Base de datos no disponible' })
    }
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
