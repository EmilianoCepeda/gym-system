const express = require('express')
const router = express.Router()
const { getMyProgress, createProgressEntry, deleteProgressEntry } = require('../controllers/progress.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/', verifyToken, verifyRole('CLIENT'), getMyProgress)
router.post('/', verifyToken, verifyRole('CLIENT'), createProgressEntry)
router.delete('/:id', verifyToken, verifyRole('CLIENT'), deleteProgressEntry)

module.exports = router