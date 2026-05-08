// backend/db/pool.js
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
pool.on('error', err => console.error('[MapUnivo] DB error:', err))
module.exports = pool
