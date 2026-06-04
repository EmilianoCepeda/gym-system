const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const { sendVerificationEmail } = require('../lib/email')

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const verifyToken = crypto.randomBytes(32).toString('hex')

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verifyToken
      }
    })

    await sendVerificationEmail(email, name, verifyToken)

    res.status(201).json({
      message: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ message: 'Token requerido' })
    }

    const user = await prisma.user.findFirst({ where: { verifyToken: token } })

    if (!user) {
      return res.status(400).json({ message: 'Token inválido' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, verifyToken: null }
    })

    res.json({ message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña requeridos' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    if (!user.verified) {
      return res.status(401).json({ message: 'Debes verificar tu correo antes de iniciar sesión' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { register, verifyEmail, login, getMe }