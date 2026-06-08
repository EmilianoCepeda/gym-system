const prisma = require('../lib/prisma')
const { cleanString, parseOptionalFiniteNumber, parsePositiveInt } = require('../lib/validators')

const getMyProgress = async (req, res) => {
  try {
    const entries = await prisma.progressEntry.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' }
    })
    res.json(entries)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const createProgressEntry = async (req, res) => {
  try {
    const weight = parseOptionalFiniteNumber(req.body.weight, 'weight', { min: 0 })
    const height = parseOptionalFiniteNumber(req.body.height, 'height', { min: 0 })
    const fatIndex = parseOptionalFiniteNumber(req.body.fatIndex, 'fatIndex', { min: 0 })
    const muscleMass = parseOptionalFiniteNumber(req.body.muscleMass, 'muscleMass', { min: 0 })
    const targetWeight = parseOptionalFiniteNumber(req.body.targetWeight, 'targetWeight', { min: 0 })
    const targetMuscle = parseOptionalFiniteNumber(req.body.targetMuscle, 'targetMuscle', { min: 0 })
    const notes = cleanString(req.body.notes, { max: 1000 })

    if (weight === null && height === null && fatIndex === null && muscleMass === null) {
      return res.status(400).json({ message: 'Ingresa al menos un dato de progreso' })
    }

    const entry = await prisma.progressEntry.create({
      data: {
        userId: req.user.id,
        weight,
        height,
        fatIndex,
        muscleMass,
        targetWeight,
        targetMuscle,
        notes: notes || null
      }
    })
    res.status(201).json(entry)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

const deleteProgressEntry = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const entry = await prisma.progressEntry.findFirst({ where: { id, userId: req.user.id } })
    if (!entry) return res.status(404).json({ message: 'Registro no encontrado' })
    await prisma.progressEntry.delete({ where: { id } })
    res.json({ message: 'Registro eliminado' })
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

module.exports = { getMyProgress, createProgressEntry, deleteProgressEntry }
