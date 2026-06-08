const prisma = require('../lib/prisma')
const { assertEnum, parseBoolean, parsePositiveInt } = require('../lib/validators')

const getUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const updateUser = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id')
    const { role, verified } = req.body

    if (id === req.user.id && role && role !== 'ADMIN') {
      return res.status(400).json({ message: 'No puedes quitarte tu propio rol de admin' })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role: assertEnum(role, ['CLIENT', 'COACH', 'ADMIN'], 'role') }),
        ...(verified !== undefined && { verified: parseBoolean(verified, 'verified') })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true
      }
    })

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(400).json({ message: error.message || 'Solicitud invalida' })
  }
}

module.exports = { getUsers, updateUser }
