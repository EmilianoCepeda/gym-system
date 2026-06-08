const prisma = require('../lib/prisma')
const { cleanString, isValidColor, isValidTime, parseNonNegativeInt, parsePositiveInt } = require('../lib/validators')

const parseDayOfWeek = (value) => {
  const day = parseNonNegativeInt(value, 'dayOfWeek')
  if (day > 6) throw new Error('dayOfWeek debe estar entre 0 y 6')
  return day
}

const parseTime = (value, fieldName) => {
  const time = cleanString(value, { max: 5 })
  if (!isValidTime(time)) throw new Error(`${fieldName} debe tener formato HH:mm`)
  return time
}

const parseColor = (value) => {
  const color = cleanString(value || '#FFE000', { max: 7 })
  if (!isValidColor(color)) throw new Error('color debe ser hexadecimal, ejemplo #FFE000')
  return color
}

const getCoachSchedule = async (req, res) => {
  try {
    const coachId = parsePositiveInt(req.params.coachId, 'coachId')
    const schedules = await prisma.schedule.findMany({
      where: { coachId },
      include: {
        coach: { select: { id: true, name: true } }
      },
      orderBy: { dayOfWeek: 'asc' }
    })
    res.json(schedules)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const getAllSchedules = async (_req, res) => {
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
    const coachId = parsePositiveInt(req.body.coachId, 'coachId')
    const dayOfWeek = parseDayOfWeek(req.body.dayOfWeek)
    const startTime = parseTime(req.body.startTime, 'startTime')
    const endTime = parseTime(req.body.endTime, 'endTime')
    const color = parseColor(req.body.color)

    const schedule = await prisma.schedule.create({
      data: {
        coachId,
        dayOfWeek,
        startTime,
        endTime,
        color
      },
      include: {
        coach: { select: { id: true, name: true } }
      }
    })
    res.status(201).json(schedule)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const updateSchedule = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...(req.body.dayOfWeek !== undefined && { dayOfWeek: parseDayOfWeek(req.body.dayOfWeek) }),
        ...(req.body.startTime && { startTime: parseTime(req.body.startTime, 'startTime') }),
        ...(req.body.endTime && { endTime: parseTime(req.body.endTime, 'endTime') }),
        ...(req.body.color && { color: parseColor(req.body.color) })
      },
      include: {
        coach: { select: { id: true, name: true } }
      }
    })
    res.json(schedule)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const deleteSchedule = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    await prisma.schedule.delete({ where: { id } })
    res.json({ message: 'Turno eliminado' })
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

module.exports = { getCoachSchedule, getAllSchedules, createSchedule, updateSchedule, deleteSchedule }
