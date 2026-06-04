const express = require('express')
const router = express.Router()
const { getMyReservations, createReservation, cancelReservation, getClassAttendees } = require('../controllers/reservation.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/my', verifyToken, getMyReservations)
router.post('/', verifyToken, verifyRole('CLIENT'), createReservation)
router.put('/:id/cancel', verifyToken, verifyRole('CLIENT'), cancelReservation)
router.get('/class/:id/attendees', verifyToken, verifyRole('COACH', 'ADMIN'), getClassAttendees)

module.exports = router