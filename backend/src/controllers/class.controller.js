const prisma = require('../lib/prisma')

const getClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      where: { status: 'ACTIVE' },
      include: {
        coach: {
          select: { id: true, name: true, email: true }
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
    const { id } = req.params
    const gymClass = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        coach: {
          select: { id: true, name: true, email: true }
        },
        reservations: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (!gymClass) {
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
    const { name, description, date, startTime, endTime, maxCapacity } = req.body

    if (!name || !description || !date || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    const gymClass = await prisma.class.create({
      data: {
        name,
        description,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxCapacity: parseInt(maxCapacity),
        coachId: req.user.id
      }
    })

    res.status(201).json(gymClass)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const updateClass = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, date, startTime, endTime, maxCapacity, status } = req.body

    const gymClass = await prisma.class.findUnique({ where: { id: parseInt(id) } })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso para editar esta clase' })
    }

    const updated = await prisma.class.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(maxCapacity && { maxCapacity: parseInt(maxCapacity) }),
        ...(status && { status })
      }
    })

    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params

    const gymClass = await prisma.class.findUnique({ where: { id: parseInt(id) } })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta clase' })
    }

    await prisma.class.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    })

    res.json({ message: 'Clase cancelada exitosamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getClasses, getClassById, createClass, updateClass, deleteClass }