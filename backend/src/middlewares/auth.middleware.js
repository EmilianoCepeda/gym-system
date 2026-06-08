const jwt = require('jsonwebtoken')

const requireJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres')
  }
  return process.env.JWT_SECRET
}

const identifyToken = (req, _res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return next()

  try {
    req.user = jwt.verify(token, requireJwtSecret())
  } catch (_err) {
    req.user = undefined
  }

  next()
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' })
  }

  try {
    const decoded = jwt.verify(token, requireJwtSecret())
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' })
  }
}

const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permiso para esta acción' })
    }
    next()
  }
}

module.exports = { identifyToken, verifyToken, verifyRole }
