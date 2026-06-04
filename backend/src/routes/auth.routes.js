const express = require('express')
const router = express.Router()
const { register, verifyEmail, login, getMe } = require('../controllers/auth.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.post('/register', register)
router.get('/verify-email', verifyEmail)
router.post('/login', login)
router.get('/me', verifyToken, getMe)

module.exports = router