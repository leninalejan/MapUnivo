// backend/routes/zonas.js
const express = require('express')
const router  = express.Router()
const pool    = require('../db/pool')
const authJWT = require('../middleware/authJWT')

router.get('/', authJWT, async (req,res) => {
  try {
    const { categoria } = req.query
    let q = 'SELECT * FROM zonas WHERE activo=TRUE', p=[]
    if (categoria) { p.push(categoria); q+=` AND categoria=$${p.length}` }
    q += ' ORDER BY orden,nombre'
    const { rows } = await pool.query(q,p)
    res.json(rows)
  } catch(err){ res.status(500).json({ error:'Error del servidor' }) }
})

router.get('/:slug', authJWT, async (req,res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM zonas WHERE slug=$1 AND activo=TRUE',[req.params.slug])
    if (!rows[0]) return res.status(404).json({ error:'Zona no encontrada' })
    res.json(rows[0])
  } catch(err){ res.status(500).json({ error:'Error del servidor' }) }
})

router.get('/:slug/salones', authJWT, async (req,res) => {
  try {
    const zona = await pool.query('SELECT id FROM zonas WHERE slug=$1',[req.params.slug])
    if (!zona.rows[0]) return res.status(404).json({ error:'Zona no encontrada' })
    const { rows } = await pool.query('SELECT * FROM salones WHERE zona_id=$1 AND activo=TRUE ORDER BY piso,codigo',[zona.rows[0].id])
    res.json(rows)
  } catch(err){ res.status(500).json({ error:'Error del servidor' }) }
})

module.exports = router
