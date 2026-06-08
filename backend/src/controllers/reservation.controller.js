const prisma = require('../lib/prisma')
const { parsePositiveInt } = require('../lib/validators')

const getMyReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: {
        class: {
          include: {
            coach: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(reservations)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const createReservation = async (req, res) => {
  try {
    const classId = parsePositiveInt(req.body.classId, 'classId')

    const reservation = await prisma.$transaction(async (tx) => {
      const gymClass = await tx.class.findUnique({ where: { id: classId } })

      if (!gymClass) throw new Error('Clase no encontrada')
      if (gymClass.status === 'CANCELLED') throw new Error('Esta clase esta cancelada')
      if (gymClass.occupied >= gymClass.maxCapacity) throw new Error('La clase esta llena')

      const subscription = await tx.subscription.findUnique({
        where: { userId: req.user.id },
        include: { plan: true }
      })

      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new Error('No tienes una suscripcion activa')
      }

      if (subscription.plan.type === 'BASIC') {
        throw new Error('Tu plan Basic no permite reservar clases')
      }

      if (subscription.plan.type === 'PREMIUM' && subscription.tokens <= 0) {
        throw new Error('No tienes tokens disponibles')
      }

      const existing = await tx.reservation.findUnique({
        where: {
          userId_classId: {
            userId: req.user.id,
            classId
          }
        }
      })

      if (existing && existing.status === 'ACTIVE') {
        throw new Error('Ya tienes una reserva activa para esta clase')
      }

      const result = existing
        ? await tx.reservation.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE' }
        })
        : await tx.reservation.create({
          data: {
            userId: req.user.id,
            classId
          }
        })

      await tx.class.update({
        where: { id: classId },
        data: { occupied: { increment: 1 } }
      })

      if (subscription.plan.type === 'PREMIUM') {
        await tx.subscription.update({
          where: { userId: req.user.id },
          data: { tokens: { decrement: 1 } }
        })
      }

      return result
    })

    res.status(201).json(reservation)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const cancelReservation = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')

    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: { id, userId: req.user.id }
      })

      if (!reservation) throw new Error('Reserva no encontrada')
      if (reservation.status === 'CANCELLED') throw new Error('La reserva ya esta cancelada')

      await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })

      await tx.class.update({
        where: { id: reservation.classId },
        data: { occupied: { decrement: 1 } }
      })
    })

    res.json({ message: 'Reserva cancelada exitosamente' })
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const getClassAttendees = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')

    const gymClass = await prisma.class.findUnique({
      where: { id }
    })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso para ver los asistentes' })
    }

    const attendees = await prisma.reservation.findMany({
      where: { classId: id, status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    })

    res.json(attendees)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

module.exports = { getMyReservations, createReservation, cancelReservation, getClassAttendees }
