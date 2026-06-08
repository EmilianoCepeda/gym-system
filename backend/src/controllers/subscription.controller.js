const prisma = require('../lib/prisma')
const { assertEnum, cleanString, parseFiniteNumber, parsePositiveInt } = require('../lib/validators')

const getPlans = async (_req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    })
    res.json(plans)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const createPlan = async (req, res) => {
  try {
    const name = cleanString(req.body.name, { max: 100 })
    const price = parseFiniteNumber(req.body.price, 'price', { min: 0 })
    const type = assertEnum(req.body.type, ['BASIC', 'PREMIUM', 'GOLD'], 'type')
    const tokenLimit = req.body.tokenLimit ? parsePositiveInt(req.body.tokenLimit, 'tokenLimit') : null
    const description = cleanString(req.body.description, { max: 1000 })
    if (!name) {
      return res.status(400).json({ message: 'Nombre, precio y tipo son requeridos' })
    }
    const plan = await prisma.subscriptionPlan.create({
      data: { name, price, type, tokenLimit, description: description || null }
    })
    res.status(201).json(plan)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const updatePlan = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const name = cleanString(req.body.name, { max: 100 })
    const description = cleanString(req.body.description, { max: 1000 })
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(req.body.price && { price: parseFiniteNumber(req.body.price, 'price', { min: 0 }) }),
        ...(req.body.tokenLimit !== undefined && {
          tokenLimit: req.body.tokenLimit ? parsePositiveInt(req.body.tokenLimit, 'tokenLimit') : null
        }),
        ...(req.body.description !== undefined && { description: description || null })
      }
    })
    res.json(plan)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const deletePlan = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    await prisma.subscriptionPlan.delete({ where: { id } })
    res.json({ message: 'Plan eliminado' })
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const assignSubscription = async (req, res) => {
  try {
    const userId = parsePositiveInt(req.body.userId, 'userId')
    const planId = parsePositiveInt(req.body.planId, 'planId')
    const durationDays = parsePositiveInt(req.body.durationDays, 'durationDays')

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) return res.status(404).json({ message: 'Plan no encontrado' })

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    const existing = await prisma.subscription.findUnique({ where: { userId } })

    let subscription
    if (existing) {
      subscription = await prisma.subscription.update({
        where: { userId },
        data: {
          planId,
          startDate: new Date(),
          endDate,
          status: 'ACTIVE',
          tokens: plan.type === 'PREMIUM' ? (plan.tokenLimit || 10) : null
        },
        include: { plan: true, user: { select: { id: true, name: true, email: true } } }
      })
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planId,
          endDate,
          tokens: plan.type === 'PREMIUM' ? (plan.tokenLimit || 10) : null
        },
        include: { plan: true, user: { select: { id: true, name: true, email: true } } }
      })
    }

    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: plan.price,
        note: `Suscripcion ${plan.name} - ${durationDays} dias`
      }
    })

    res.status(201).json(subscription)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const grantTokens = async (req, res) => {
  try {
    const userId = parsePositiveInt(req.body.userId, 'userId')
    const tokens = parsePositiveInt(req.body.tokens, 'tokens')

    const subscription = await prisma.subscription.findUnique({ where: { userId } })
    if (!subscription) return res.status(404).json({ message: 'El usuario no tiene suscripcion activa' })
    if (subscription.tokens === null) return res.status(400).json({ message: 'Este plan no usa tokens' })

    const updated = await prisma.subscription.update({
      where: { userId },
      data: { tokens: { increment: tokens } }
    })

    res.json({ message: `${tokens} tokens otorgados`, tokens: updated.tokens })
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const getSubscriptions = async (_req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true
      },
      orderBy: { endDate: 'asc' }
    })
    res.json(subscriptions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getPayments = async (_req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscription: { include: { plan: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(payments)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const addManualPayment = async (req, res) => {
  try {
    const userId = parsePositiveInt(req.body.userId, 'userId')
    const amount = parseFiniteNumber(req.body.amount, 'amount', { min: 0 })
    const note = cleanString(req.body.note, { max: 1000 })
    const payment = await prisma.payment.create({
      data: { userId, amount, note: note || null },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
    res.status(201).json(payment)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const getMySubscription = async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
      include: { plan: true }
    })
    res.json(subscription || null)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getPlans, createPlan, updatePlan, deletePlan, assignSubscription, grantTokens, getSubscriptions, getPayments, addManualPayment, getMySubscription }
