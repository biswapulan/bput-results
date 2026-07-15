import { checkRateLimit } from '../../../lib/auth'
import { createAdminSessionToken, buildAdminSessionCookie } from '../../../lib/adminSession'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { adminSecret } = req.body || {}
  if (!adminSecret) return res.status(400).json({ error: 'Admin secret is required.' })

  if (!process.env.ADMIN_SECRET) {
    return res.status(500).json({ error: 'ADMIN_SECRET is not configured on the server.' })
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim()

  try {
    const withinLimit = await checkRateLimit(`adminloginattempts:${ip}`, 8, 600)
    if (!withinLimit) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' })
    }

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Invalid admin secret.' })
    }

    const token = await createAdminSessionToken()
    res.setHeader('Set-Cookie', buildAdminSessionCookie(token))
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Admin login error:', e)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
