const prisma = require('../lib/prisma')

const getUsers = async (req, res) => {
  try {
    const isCoach = req.user?.role === 'COACH'
    const users = await prisma.user.findMany({
      where: isCoach ? { role: 'CLIENT' } : undefined,
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
    const { id } = req.params
    const { role, verified } = req.body

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(role && { role }),
        ...(verified !== undefined && { verified })
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
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getUsers, updateUser }
