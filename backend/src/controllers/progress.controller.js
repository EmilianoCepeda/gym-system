const prisma = require('../lib/prisma')

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
    const { weight, height, fatIndex, muscleMass, targetWeight, targetMuscle, notes } = req.body

    if (!weight && !height && !fatIndex && !muscleMass) {
      return res.status(400).json({ message: 'Ingresa al menos un dato de progreso' })
    }

    const entry = await prisma.progressEntry.create({
      data: {
        userId: req.user.id,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        fatIndex: fatIndex ? parseFloat(fatIndex) : null,
        muscleMass: muscleMass ? parseFloat(muscleMass) : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        targetMuscle: targetMuscle ? parseFloat(targetMuscle) : null,
        notes: notes || null
      }
    })
    res.status(201).json(entry)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const deleteProgressEntry = async (req, res) => {
  try {
    const { id } = req.params
    const entry = await prisma.progressEntry.findUnique({ where: { id: parseInt(id) } })
    if (!entry) return res.status(404).json({ message: 'Registro no encontrado' })
    if (entry.userId !== req.user.id) return res.status(403).json({ message: 'No tienes permiso' })
    await prisma.progressEntry.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Registro eliminado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getMyProgress, createProgressEntry, deleteProgressEntry }