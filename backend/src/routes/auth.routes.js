const express = require('express')
const router = express.Router()
const { register, verifyEmail, login, getMe, updateProfile } = require('../controllers/auth.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.post('/register', register)
router.get('/verify-email', verifyEmail)
router.post('/login', login)
router.get('/me', verifyToken, getMe)
router.put('/profile', verifyToken, updateProfile)

module.exports = router