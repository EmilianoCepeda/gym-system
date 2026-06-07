const express = require('express')
const cors = require('cors')
require('dotenv').config()

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

app.use(cors())
app.use(express.json())

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

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})