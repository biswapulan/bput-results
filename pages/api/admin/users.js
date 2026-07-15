import { readCookie } from '../../../lib/session'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'
import { createUser, deleteUser, listUsers } from '../../../lib/auth'

async function requireAdmin(req, res) {
  const token = readCookie(req.headers.cookie, ADMIN_SESSION_COOKIE)
  const session = await verifyAdminSessionToken(token)
  if (!session) {
    res.status(401).json({ error: 'Admin login required.' })
    return false
  }
  return true
}

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return

  if (req.method === 'GET') {
    try {
      const users = await listUsers()
      return res.status(200).json({ users })
    } catch (e) {
      console.error('List users error:', e)
      return res.status(500).json({ error: 'Could not load accounts.' })
    }
  }

  if (req.method === 'POST') {
    const { username, password, role } = req.body || {}
    try {
      const user = await createUser({ username, password, role })
      return res.status(201).json({ ok: true, user })
    } catch (e) {
      return res.status(400).json({ error: e.message })
    }
  }

  if (req.method === 'DELETE') {
    const { username } = req.body || {}
    if (!username) return res.status(400).json({ error: 'Username is required.' })
    try {
      await deleteUser(username)
      return res.status(200).json({ ok: true })
    } catch (e) {
      console.error('Delete user error:', e)
      return res.status(500).json({ error: 'Could not remove account.' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
