const express = require('express')
const router = express.Router()
const { getUsers, updateUser } = require('../controllers/admin.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/users', verifyToken, verifyRole('ADMIN'), getUsers)
router.get('/clients', verifyToken, verifyRole('ADMIN', 'COACH'), getUsers)
router.put('/users/:id', verifyToken, verifyRole('ADMIN'), updateUser)

module.exports = router