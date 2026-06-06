const prisma = require('../lib/prisma')

const getPlans = async (req, res) => {
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
    const { name, price, type, tokenLimit, description } = req.body
    if (!name || !price || !type) {
      return res.status(400).json({ message: 'Nombre, precio y tipo son requeridos' })
    }
    const plan = await prisma.subscriptionPlan.create({
      data: { name, price: parseFloat(price), type, tokenLimit: tokenLimit ? parseInt(tokenLimit) : null, description }
    })
    res.status(201).json(plan)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params
    const { name, price, tokenLimit, description } = req.body
    const plan = await prisma.subscriptionPlan.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(price && { price: parseFloat(price) }),
        ...(tokenLimit !== undefined && { tokenLimit: tokenLimit ? parseInt(tokenLimit) : null }),
        ...(description !== undefined && { description })
      }
    })
    res.json(plan)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.subscriptionPlan.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Plan eliminado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const assignSubscription = async (req, res) => {
  try {
    const { userId, planId, durationDays } = req.body
    if (!userId || !planId || !durationDays) {
      return res.status(400).json({ message: 'userId, planId y durationDays son requeridos' })
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: parseInt(planId) } })
    if (!plan) return res.status(404).json({ message: 'Plan no encontrado' })

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + parseInt(durationDays))

    const existing = await prisma.subscription.findUnique({ where: { userId: parseInt(userId) } })

    let subscription
    if (existing) {
      subscription = await prisma.subscription.update({
        where: { userId: parseInt(userId) },
        data: {
          planId: parseInt(planId),
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
          userId: parseInt(userId),
          planId: parseInt(planId),
          endDate,
          tokens: plan.type === 'PREMIUM' ? (plan.tokenLimit || 10) : null
        },
        include: { plan: true, user: { select: { id: true, name: true, email: true } } }
      })
    }

    await prisma.payment.create({
      data: {
        userId: parseInt(userId),
        subscriptionId: subscription.id,
        amount: plan.price,
        note: `Suscripción ${plan.name} — ${durationDays} días`
      }
    })

    res.status(201).json(subscription)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const grantTokens = async (req, res) => {
  try {
    const { userId, tokens, note } = req.body
    if (!userId || !tokens) {
      return res.status(400).json({ message: 'userId y tokens son requeridos' })
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId: parseInt(userId) } })
    if (!subscription) return res.status(404).json({ message: 'El usuario no tiene suscripción activa' })
    if (subscription.tokens === null) return res.status(400).json({ message: 'Este plan no usa tokens' })

    const updated = await prisma.subscription.update({
      where: { userId: parseInt(userId) },
      data: { tokens: { increment: parseInt(tokens) } }
    })

    res.json({ message: `${tokens} tokens otorgados`, tokens: updated.tokens })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getSubscriptions = async (req, res) => {
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

const getPayments = async (req, res) => {
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
    const { userId, amount, note } = req.body
    if (!userId || !amount) {
      return res.status(400).json({ message: 'userId y amount son requeridos' })
    }
    const payment = await prisma.payment.create({
      data: { userId: parseInt(userId), amount: parseFloat(amount), note },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
    res.status(201).json(payment)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
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