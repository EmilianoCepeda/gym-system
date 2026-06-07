const express = require('express')
const router = express.Router()
const { getClassAttendance, markAttendance, getCoachStats } = require('../controllers/attendance.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/stats', verifyToken, verifyRole('COACH'), getCoachStats)
router.get('/class/:classId', verifyToken, verifyRole('COACH', 'ADMIN'), getClassAttendance)
router.post('/mark', verifyToken, verifyRole('COACH', 'ADMIN'), markAttendance)

module.exports = router