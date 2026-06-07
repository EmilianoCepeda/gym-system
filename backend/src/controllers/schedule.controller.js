const prisma = require('../lib/prisma')

const getCoachSchedule = async (req, res) => {
  try {
    const { coachId } = req.params
    const schedules = await prisma.schedule.findMany({
      where: { coachId: parseInt(coachId) },
      include: {
        coach: { select: { id: true, name: true } }
      },
      orderBy: { dayOfWeek: 'asc' }
    })
    res.json(schedules)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getAllSchedules = async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        coach: { select: { id: true, name: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    })
    res.json(schedules)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const createSchedule = async (req, res) => {
  try {
    const { coachId, dayOfWeek, startTime, endTime, color } = req.body
    if (!coachId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }
    const schedule = await prisma.schedule.create({
      data: {
        coachId: parseInt(coachId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        color: color || '#FFE000'
      },
      include: {
        coach: { select: { id: true, name: true } }
      }
    })
    res.status(201).json(schedule)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params
    const { dayOfWeek, startTime, endTime, color } = req.body
    const schedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(color && { color })
      },
      include: {
        coach: { select: { id: true, name: true } }
      }
    })
    res.json(schedule)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.schedule.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Turno eliminado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getCoachSchedule, getAllSchedules, createSchedule, updateSchedule, deleteSchedule }