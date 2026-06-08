const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/\0/g, '')
      .replace(/[\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
        .map(([key, nested]) => [key, sanitizeValue(nested)])
    )
  }

  return value
}

const replaceObjectContents = (target, source) => {
  if (!target || typeof target !== 'object') return source

  for (const key of Object.keys(target)) {
    delete target[key]
  }

  Object.assign(target, source)
  return target
}

const sanitizeInput = (req, _res, next) => {
  req.body = sanitizeValue(req.body)
  replaceObjectContents(req.params, sanitizeValue(req.params))
  replaceObjectContents(req.query, sanitizeValue(req.query))
  next()
}

module.exports = { sanitizeInput }
