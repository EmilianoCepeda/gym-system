const prisma = require('../lib/prisma')
const {
  assertEnum,
  cleanString,
  parseDate,
  parsePositiveInt
} = require('../lib/validators')

const getClasses = async (_req, res) => {
  try {
    const classes = await prisma.class.findMany({
      where: { status: 'ACTIVE' },
      include: {
        coach: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: 'asc' }
    })
    res.json(classes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getClassById = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const gymClass = await prisma.class.findUnique({
      where: { id },
      include: {
        coach: {
          select: { id: true, name: true }
        }
      }
    })

    if (!gymClass || gymClass.status !== 'ACTIVE') {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    res.json(gymClass)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const createClass = async (req, res) => {
  try {
    const name = cleanString(req.body.name, { max: 100 })
    const description = cleanString(req.body.description, { max: 1000 })
    const { date, startTime, endTime, maxCapacity } = req.body

    if (!name || !description || !date || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    const gymClass = await prisma.class.create({
      data: {
        name,
        description,
        date: parseDate(date, 'date'),
        startTime: parseDate(startTime, 'startTime'),
        endTime: parseDate(endTime, 'endTime'),
        maxCapacity: parsePositiveInt(maxCapacity, 'maxCapacity'),
        coachId: req.user.id
      }
    })

    res.status(201).json(gymClass)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const updateClass = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const name = cleanString(req.body.name, { max: 100 })
    const description = cleanString(req.body.description, { max: 1000 })
    const { date, startTime, endTime, maxCapacity, status } = req.body

    const gymClass = await prisma.class.findUnique({ where: { id } })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso para editar esta clase' })
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(date && { date: parseDate(date, 'date') }),
        ...(startTime && { startTime: parseDate(startTime, 'startTime') }),
        ...(endTime && { endTime: parseDate(endTime, 'endTime') }),
        ...(maxCapacity && { maxCapacity: parsePositiveInt(maxCapacity, 'maxCapacity') }),
        ...(status && { status: assertEnum(status, ['ACTIVE', 'CANCELLED'], 'status') })
      }
    })

    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const deleteClass = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const gymClass = await prisma.class.findUnique({ where: { id } })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta clase' })
    }

    await prisma.class.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    res.json({ message: 'Clase cancelada exitosamente' })
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

module.exports = { getClasses, getClassById, createClass, updateClass, deleteClass }
