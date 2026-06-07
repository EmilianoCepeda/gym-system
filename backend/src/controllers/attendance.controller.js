const prisma = require('../lib/prisma')

const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params

    const gymClass = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso' })
    }

    const reservations = await prisma.reservation.findMany({
      where: { classId: parseInt(classId), status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    })

    const attendances = await prisma.attendance.findMany({
      where: { classId: parseInt(classId) }
    })

    const result = reservations.map(r => {
      const att = attendances.find(a => a.userId === r.userId)
      return {
        userId: r.userId,
        user: r.user,
        attended: att ? att.attended : false,
        attendanceId: att ? att.id : null
      }
    })

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const markAttendance = async (req, res) => {
  try {
    const { classId, userId, attended } = req.body

    if (!classId || !userId || attended === undefined) {
      return res.status(400).json({ message: 'classId, userId y attended son requeridos' })
    }

    const gymClass = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    })

    if (!gymClass) {
      return res.status(404).json({ message: 'Clase no encontrada' })
    }

    if (gymClass.coachId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso' })
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_classId: {
          userId: parseInt(userId),
          classId: parseInt(classId)
        }
      },
      update: { attended },
      create: {
        userId: parseInt(userId),
        classId: parseInt(classId),
        attended
      }
    })

    res.json(attendance)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getCoachStats = async (req, res) => {
  try {
    const coachId = req.user.id

    const classes = await prisma.class.findMany({
      where: { coachId },
      include: {
        reservations: { where: { status: 'ACTIVE' } },
        attendances: true
      }
    })

    const totalClasses = classes.length
    const activeClasses = classes.filter(c => c.status === 'ACTIVE').length
    const totalStudents = classes.reduce((acc, c) => acc + c.reservations.length, 0)
    const totalAttended = classes.reduce((acc, c) => acc + c.attendances.filter(a => a.attended).length, 0)
    const avgAttendance = totalStudents > 0 ? Math.round((totalAttended / totalStudents) * 100) : 0

    const mostPopular = classes.reduce((prev, curr) =>
      curr.reservations.length > (prev?.reservations?.length || 0) ? curr : prev, null)

    const thisMonth = new Date()
    const classesThisMonth = classes.filter(c => {
      const classDate = new Date(c.date)
      return classDate.getMonth() === thisMonth.getMonth() &&
        classDate.getFullYear() === thisMonth.getFullYear()
    }).length

    res.json({
      totalClasses,
      activeClasses,
      totalStudents,
      avgAttendance,
      classesThisMonth,
      mostPopularClass: mostPopular ? { name: mostPopular.name, students: mostPopular.reservations.length } : null
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { getClassAttendance, markAttendance, getCoachStats }