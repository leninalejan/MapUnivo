// backend/server.js
require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const app     = express()
const PORT    = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

app.use('/api/auth',    require('./routes/auth'))
app.use('/api/zonas',   require('./routes/zonas'))
app.use('/api/salones', require('./routes/salones'))
app.get('/api/health',  (_,res) => res.json({ status:'ok', project:'MapUnivo', ts: new Date() }))

app.listen(PORT, () => console.log(`✅  MapUnivo API → http://localhost:${PORT}`))
