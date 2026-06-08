const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const VALID_COLOR = /^#[0-9a-fA-F]{6}$/

const cleanString = (value, { max = 500, lower = false } = {}) => {
  if (typeof value !== 'string') return ''

  const cleaned = value
    .replace(/\0/g, '')
    .replace(/[\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max)

  return lower ? cleaned.toLowerCase() : cleaned
}

const isValidEmail = (value) => VALID_EMAIL.test(value)

const parsePositiveInt = (value, fieldName) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} debe ser un entero positivo`)
  }
  return parsed
}

const parseNonNegativeInt = (value, fieldName) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} debe ser un entero no negativo`)
  }
  return parsed
}

const parseFiniteNumber = (value, fieldName, { min = null } = {}) => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || (min !== null && parsed < min)) {
    throw new Error(`${fieldName} debe ser un numero valido`)
  }
  return parsed
}

const parseOptionalFiniteNumber = (value, fieldName, options) => {
  if (value === undefined || value === null || value === '') return null
  return parseFiniteNumber(value, fieldName, options)
}

const parseDate = (value, fieldName) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} debe ser una fecha valida`)
  }
  return parsed
}

const parseBoolean = (value, fieldName) => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`${fieldName} debe ser booleano`)
}

const assertEnum = (value, allowed, fieldName) => {
  if (!allowed.includes(value)) {
    throw new Error(`${fieldName} no es valido`)
  }
  return value
}

const isValidTime = (value) => VALID_TIME.test(value)
const isValidColor = (value) => VALID_COLOR.test(value)

module.exports = {
  assertEnum,
  cleanString,
  isValidColor,
  isValidEmail,
  isValidTime,
  parseBoolean,
  parseDate,
  parseFiniteNumber,
  parseNonNegativeInt,
  parseOptionalFiniteNumber,
  parsePositiveInt
}
