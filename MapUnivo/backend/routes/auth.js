// backend/routes/auth.js
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../db/pool')
const authJWT = require('../middleware/authJWT')
const { isDatabaseUnavailable } = require('../lib/dbErrors')

router.post('/login', async (req, res) => {
  const { carnet, password } = req.body

  if (!carnet || !password) {
    return res.status(400).json({ error: 'Carnet y contrasena requeridos' })
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE carnet=$1 AND activo=TRUE',
      [carnet.toUpperCase()]
    )

    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' })
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    await pool.query('UPDATE usuarios SET ultimo_acceso=NOW() WHERE id=$1', [user.id])

    const token = jwt.sign(
      { id: user.id, carnet: user.carnet, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        carnet: user.carnet,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        facultad: user.facultad,
        carrera: user.carrera,
      },
    })
  } catch (err) {
    console.error(err)
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'Base de datos no disponible' })
    }
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/logout', authJWT, (_req, res) => res.json({ message: 'Sesion cerrada' }))

router.get('/me', authJWT, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,carnet,nombre,apellido,email,rol,facultad,carrera FROM usuarios WHERE id=$1',
      [req.user.id]
    )
    res.json(rows[0])
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'Base de datos no disponible' })
    }
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
