const express = require('express')
const router = express.Router()
const {
  getPlans, createPlan, updatePlan, deletePlan,
  assignSubscription, grantTokens, getSubscriptions,
  getPayments, addManualPayment, getMySubscription
} = require('../controllers/subscription.controller')
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware')

router.get('/plans', getPlans)
router.post('/plans', verifyToken, verifyRole('ADMIN'), createPlan)
router.put('/plans/:id', verifyToken, verifyRole('ADMIN'), updatePlan)
router.delete('/plans/:id', verifyToken, verifyRole('ADMIN'), deletePlan)

router.get('/my', verifyToken, getMySubscription)
router.get('/', verifyToken, verifyRole('ADMIN'), getSubscriptions)
router.post('/assign', verifyToken, verifyRole('ADMIN'), assignSubscription)
router.post('/grant-tokens', verifyToken, verifyRole('ADMIN'), grantTokens)

router.get('/payments', verifyToken, verifyRole('ADMIN'), getPayments)
router.post('/payments/manual', verifyToken, verifyRole('ADMIN'), addManualPayment)

module.exports = router