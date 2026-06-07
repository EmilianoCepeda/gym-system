const express = require('express')
const router = express.Router()
const { getCoachSchedule, getAllSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/schedule.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/', verifyToken, getAllSchedules)
router.get('/:coachId', verifyToken, getCoachSchedule)
router.post('/', verifyToken, verifyRole('ADMIN'), createSchedule)
router.put('/:id', verifyToken, verifyRole('ADMIN'), updateSchedule)
router.delete('/:id', verifyToken, verifyRole('ADMIN'), deleteSchedule)

module.exports = router