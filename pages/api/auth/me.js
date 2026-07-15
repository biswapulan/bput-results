import { readCookie, verifySessionToken, SESSION_COOKIE } from '../../../lib/session'

export default async function handler(req, res) {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE)
  const session = await verifySessionToken(token)
  if (!session) return res.status(401).json({ loggedIn: false })
  return res.status(200).json({ loggedIn: true, username: session.username, role: session.role })
}
