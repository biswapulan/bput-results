import { createUser } from '../../../lib/auth'

// There is NO signup page and NO link to this endpoint anywhere in the UI.
// After you verify someone as a CR/faculty over WhatsApp, create their
// account by calling this endpoint yourself, e.g.:
//
// curl -X POST https://result.bputnotes.in/api/admin/create-user \
//   -H "Content-Type: application/json" \
//   -d '{"adminSecret":"YOUR_ADMIN_SECRET","username":"cr_cse_2021","password":"a-strong-password","role":"CR"}'
//
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { adminSecret, username, password, role } = req.body || {}

  if (!process.env.ADMIN_SECRET) {
    return res.status(500).json({ error: 'ADMIN_SECRET is not configured on the server.' })
  }
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid admin secret.' })
  }

  try {
    const user = await createUser({ username, password, role })
    return res.status(201).json({ ok: true, user })
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
}
