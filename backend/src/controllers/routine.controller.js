const prisma = require('../lib/prisma')
const { cleanString, parsePositiveInt } = require('../lib/validators')

const getMyRoutines = async (req, res) => {
  try {
    const routines = await prisma.routine.findMany({
      where: { clientId: req.user.id },
      include: {
        coach: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(routines)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getCoachRoutines = async (req, res) => {
  try {
    const routines = await prisma.routine.findMany({
      where: { coachId: req.user.id },
      include: {
        client: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(routines)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const createRoutine = async (req, res) => {
  try {
    const title = cleanString(req.body.title, { max: 120 })
    const description = cleanString(req.body.description, { max: 1000 })
    const exercises = cleanString(req.body.exercises, { max: 10000 })
    const clientId = parsePositiveInt(req.body.clientId, 'clientId')

    if (!title || !exercises) {
      return res.status(400).json({ message: 'Titulo, ejercicios y cliente son requeridos' })
    }

    const allowedClient = await prisma.reservation.findFirst({
      where: {
        userId: clientId,
        status: 'ACTIVE',
        class: { coachId: req.user.id }
      }
    })

    if (!allowedClient) {
      return res.status(403).json({ message: 'No tienes permiso para asignar rutinas a este cliente' })
    }

    const routine = await prisma.routine.create({
      data: {
        title,
        description: description || null,
        exercises,
        coachId: req.user.id,
        clientId
      },
      include: {
        client: { select: { id: true, name: true, email: true } }
      }
    })
    res.status(201).json(routine)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const updateRoutine = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const title = cleanString(req.body.title, { max: 120 })
    const description = cleanString(req.body.description, { max: 1000 })
    const exercises = cleanString(req.body.exercises, { max: 10000 })
    const routine = await prisma.routine.findFirst({ where: { id, coachId: req.user.id } })
    if (!routine) return res.status(404).json({ message: 'Rutina no encontrada' })
    const updated = await prisma.routine.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(req.body.description !== undefined && { description: description || null }),
        ...(exercises && { exercises })
      }
    })
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const deleteRoutine = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const routine = await prisma.routine.findFirst({ where: { id, coachId: req.user.id } })
    if (!routine) return res.status(404).json({ message: 'Rutina no encontrada' })
    await prisma.routine.delete({ where: { id } })
    res.json({ message: 'Rutina eliminada' })
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

module.exports = { getMyRoutines, getCoachRoutines, createRoutine, updateRoutine, deleteRoutine }
