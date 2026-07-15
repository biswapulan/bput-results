import { getUser, verifyPassword, checkLoginRateLimit } from '../../../lib/auth'
import { createSessionToken, buildSessionCookie } from '../../../lib/session'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim()

  try {
    const withinLimit = await checkLoginRateLimit(ip)
    if (!withinLimit) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' })
    }

    const user = await getUser(username)
    const ok = await verifyPassword(user, password)
    if (!ok) {
      // Deliberately generic — never reveal whether the username exists.
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const token = await createSessionToken({ username: user.username, role: user.role })
    res.setHeader('Set-Cookie', buildSessionCookie(token))
    return res.status(200).json({ username: user.username, role: user.role })
  } catch (e) {
    console.error('Login error:', e)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
