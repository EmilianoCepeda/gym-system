const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { identifyToken } = require('./middlewares/auth.middleware')
const { rateLimit } = require('./middlewares/rateLimit.middleware')
const { sanitizeInput } = require('./middlewares/sanitize.middleware')
const authRoutes = require('./routes/auth.routes')
const classRoutes = require('./routes/class.routes')
const reservationRoutes = require('./routes/reservation.routes')
const adminRoutes = require('./routes/admin.routes')
const subscriptionRoutes = require('./routes/subscription.routes')
const routineRoutes = require('./routes/routine.routes')
const progressRoutes = require('./routes/progress.routes')
const scheduleRoutes = require('./routes/schedule.routes')
const attendanceRoutes = require('./routes/attendance.routes')

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configura JWT_SECRET en variables de entorno con al menos 32 caracteres.')
}

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('Configura CORS_ORIGIN o FRONTEND_URL antes de publicar en produccion.')
}

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(cors({
  origin(origin, callback) {
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origen no permitido por CORS'))
  },
  credentials: true
}))

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY')
  next()
})

app.use(express.json({ limit: '100kb' }))
app.use(sanitizeInput)
app.use(identifyToken)
app.use(rateLimit)

app.use('/api/auth', authRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/routines', routineRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/attendance', attendanceRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Gym System API funcionando ✅' })
})

app.use((err, _req, res, next) => {
  if (!err) return next()

  if (err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({ message: 'Origen no permitido por CORS' })
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'El cuerpo de la peticion es demasiado grande' })
  }

  console.error(err)
  res.status(500).json({ message: 'Error interno del servidor' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
