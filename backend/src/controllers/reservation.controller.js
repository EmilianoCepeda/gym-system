const prisma = require('../lib/prisma')

const getMyReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: {
        class: {
          include: {
            coach: {
              select: { id: true, name: true, email: true }
            }
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
    const { classId } = req.body

    if (!classId) {
      return res.status(400).json({ message: 'classId es requerido' })
    }

    const gymClass = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Esta clase está cancelada' })
    }

    if (gymClass.occupied >= gymClass.maxCapacity) {
      return res.status(400).json({ message: 'La clase está llena' })
    }

    const existing = await prisma.reservation.findUnique({
      where: {
        userId_classId: {
          userId: req.user.id,
          classId: parseInt(classId)
        }
      }
    })

    if (existing && existing.status === 'ACTIVE') {
      return res.status(400).json({ message: 'Ya tienes una reserva activa para esta clase' })
    }

    if (existing && existing.status === 'CANCELLED') {
      const updated = await prisma.reservation.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE' }
      })

      await prisma.class.update({
        where: { id: parseInt(classId) },
        data: { occupied: { increment: 1 } }
      })

      return res.status(201).json(updated)
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: req.user.id,
        classId: parseInt(classId)
      }
    })

    await prisma.class.update({
      where: { id: parseInt(classId) },
      data: { occupied: { increment: 1 } }
    })

    res.status(201).json(reservation)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params

    const reservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id) }
    })

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' })
    }

    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar esta reserva' })
    }

    if (reservation.status === 'CANCELLED') {
      return res.status(400).json({ message: 'La reserva ya está cancelada' })
    }

    await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    })

    await prisma.class.update({
      where: { id: reservation.classId },
      data: { occupied: { decrement: 1 } }
    })

    res.json({ message: 'Reserva cancelada exitosamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getClassAttendees = async (req, res) => {
  try {
    const { id } = req.params

    const gymClass = await prisma.class.findUnique({
      where: { id: parseInt(id) }
    })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso para ver los asistentes' })
    }

    const attendees = await prisma.reservation.findMany({
      where: { classId: parseInt(id), status: 'ACTIVE' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    res.json(attendees)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getMyReservations, createReservation, cancelReservation, getClassAttendees }