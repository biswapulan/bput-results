import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

// Vercel's Upstash-for-Redis integration names the injected env vars
// KV_REST_API_URL / KV_REST_API_TOKEN (legacy "Vercel KV" naming), not
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. We support both so this
// works regardless of which naming your integration happened to use.
const kv = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
})

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

// Very simple KV-backed rate limiter, keyed by any string (e.g. an IP).
// Allows `limit` attempts per `windowSeconds` under that key.
export async function checkRateLimit(key, limit, windowSeconds) {
  const count = await kv.incr(key)
  if (count === 1) await kv.expire(key, windowSeconds)
  return count <= limit
}

// Very simple KV-backed rate limiter for login attempts, keyed by IP.
// Allows 8 attempts per 10 minutes per IP.
export async function checkLoginRateLimit(ip) {
  return checkRateLimit(`loginattempts:${ip}`, 8, 600)
}

// Lists all CR/faculty accounts (no password hashes included) — used by the
// admin panel to show who currently has bulk-checker access.
export async function listUsers() {
  const usernames = await kv.smembers('users:index')
  if (!usernames || usernames.length === 0) return []
  const users = await Promise.all(usernames.map(u => kv.get(userKey(u))))
  return users
    .filter(Boolean)
    .map(({ username, role, createdAt }) => ({ username, role, createdAt }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
