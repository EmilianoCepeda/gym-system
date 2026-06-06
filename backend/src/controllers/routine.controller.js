const prisma = require('../lib/prisma')

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
    const { title, description, exercises, clientId } = req.body
    if (!title || !exercises || !clientId) {
      return res.status(400).json({ message: 'Título, ejercicios y cliente son requeridos' })
    }
    const routine = await prisma.routine.create({
      data: {
        title,
        description,
        exercises,
        coachId: req.user.id,
        clientId: parseInt(clientId)
      },
      include: {
        client: { select: { id: true, name: true, email: true } }
      }
    })
    res.status(201).json(routine)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const updateRoutine = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, exercises } = req.body
    const routine = await prisma.routine.findUnique({ where: { id: parseInt(id) } })
    if (!routine) return res.status(404).json({ message: 'Rutina no encontrada' })
    if (routine.coachId !== req.user.id) return res.status(403).json({ message: 'No tienes permiso' })
    const updated = await prisma.routine.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(exercises && { exercises })
      }
    })
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const deleteRoutine = async (req, res) => {
  try {
    const { id } = req.params
    const routine = await prisma.routine.findUnique({ where: { id: parseInt(id) } })
    if (!routine) return res.status(404).json({ message: 'Rutina no encontrada' })
    if (routine.coachId !== req.user.id) return res.status(403).json({ message: 'No tienes permiso' })
    await prisma.routine.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Rutina eliminada' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getMyRoutines, getCoachRoutines, createRoutine, updateRoutine, deleteRoutine }