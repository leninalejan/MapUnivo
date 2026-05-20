// backend/middleware/authJWT.js
const jwt = require('jsonwebtoken')

module.exports = function authJWT(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado' })
  }

  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : header.trim()

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' })
  }
}
