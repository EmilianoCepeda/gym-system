const express = require('express')
const router = express.Router()
const { getMyRoutines, getCoachRoutines, createRoutine, updateRoutine, deleteRoutine } = require('../controllers/routine.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/my', verifyToken, verifyRole('CLIENT'), getMyRoutines)
router.get('/coach', verifyToken, verifyRole('COACH'), getCoachRoutines)
router.post('/', verifyToken, verifyRole('COACH'), createRoutine)
router.put('/:id', verifyToken, verifyRole('COACH'), updateRoutine)
router.delete('/:id', verifyToken, verifyRole('COACH'), deleteRoutine)

module.exports = router