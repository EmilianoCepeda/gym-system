const express = require('express')
const router = express.Router()
const { getClasses, getClassById, createClass, updateClass, deleteClass } = require('../controllers/class.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/', getClasses)
router.get('/:id', getClassById)
router.post('/', verifyToken, verifyRole('COACH', 'ADMIN'), createClass)
router.put('/:id', verifyToken, verifyRole('COACH', 'ADMIN'), updateClass)
router.delete('/:id', verifyToken, verifyRole('COACH', 'ADMIN'), deleteClass)

module.exports = router