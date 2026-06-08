const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const { sendVerificationEmail } = require('../lib/email')
const { cleanString, isValidEmail } = require('../lib/validators')

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const PASSWORD_SALT_ROUNDS = Number.parseInt(process.env.PASSWORD_SALT_ROUNDS || '12', 10)

const register = async (req, res) => {
  try {
    const name = cleanString(req.body.name, { max: 80 })
    const email = cleanString(req.body.email, { max: 160, lower: true })
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Correo invalido' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contrasena debe tener al menos 8 caracteres' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya esta registrado' })
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
    const verifyToken = crypto.randomBytes(32).toString('hex')

    await prisma.user.create({
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
    const token = cleanString(req.query.token, { max: 64 })

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: 'Token requerido' })
    }

    const user = await prisma.user.findFirst({ where: { verifyToken: token } })

    if (!user) {
      return res.status(400).json({ message: 'Token invalido' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, verifyToken: null }
    })

    res.json({ message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesion.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const login = async (req, res) => {
  try {
    const email = cleanString(req.body.email, { max: 160, lower: true })
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contrasena requeridos' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Correo invalido' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    if (!user.verified) {
      return res.status(401).json({ message: 'Debes verificar tu correo antes de iniciar sesion' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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

const updateProfile = async (req, res) => {
  try {
    const name = cleanString(req.body.name, { max: 80 })
    if (!name) {
      return res.status(400).json({ message: 'El nombre es requerido' })
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { register, verifyEmail, login, getMe, updateProfile }
