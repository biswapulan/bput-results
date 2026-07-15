import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const kv = Redis.fromEnv()

const userKey = (username) => `user:${username.trim().toLowerCase()}`

// { username, passwordHash, role: 'CR' | 'faculty', createdAt }
export async function getUser(username) {
  if (!username) return null
  return kv.get(userKey(username))
}

export async function createUser({ username, password, role }) {
  const clean = username.trim().toLowerCase()
  if (!clean || !password || password.length < 6) {
    throw new Error('Username and a password of at least 6 characters are required.')
  }
  if (!['CR', 'faculty'].includes(role)) {
    throw new Error("Role must be 'CR' or 'faculty'.")
  }
  const existing = await kv.get(userKey(clean))
  if (existing) throw new Error('That username already exists.')

  const passwordHash = await bcrypt.hash(password, 10)
  const record = { username: clean, passwordHash, role, createdAt: new Date().toISOString() }
  await kv.set(userKey(clean), record)
  // Keep an index so we can list users later if needed (e.g. to revoke access).
  await kv.sadd('users:index', clean)
  return { username: clean, role }
}

export async function deleteUser(username) {
  const clean = username.trim().toLowerCase()
  await kv.del(userKey(clean))
  await kv.srem('users:index', clean)
}

export async function verifyPassword(user, password) {
  if (!user) return false
  return bcrypt.compare(password, user.passwordHash)
}

// Very simple KV-backed rate limiter for login attempts, keyed by IP.
// Allows 8 attempts per 10 minutes per IP.
export async function checkLoginRateLimit(ip) {
  const key = `loginattempts:${ip}`
  const count = await kv.incr(key)
  if (count === 1) await kv.expire(key, 600) // 10 minutes
  return count <= 8
}
