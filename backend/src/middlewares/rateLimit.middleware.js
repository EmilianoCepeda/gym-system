const buckets = new Map()

const WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
const MAX_REQUESTS = Number.parseInt(process.env.RATE_LIMIT_MAX || '60', 10)

const getClientKey = (req) => {
  const userId = req.user?.id
  return userId ? `user:${userId}` : `ip:${req.ip}`
}

const rateLimit = (req, res, next) => {
  const now = Date.now()
  const key = getClientKey(req)
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return next()
  }

  current.count += 1

  if (current.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000)
    res.set('Retry-After', String(retryAfter))
    return res.status(429).json({ message: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' })
  }

  next()
}

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}, WINDOW_MS).unref()

module.exports = { rateLimit }
