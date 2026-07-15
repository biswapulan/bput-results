import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'bput_session'
const SESSION_MAX_AGE = 60 * 60 * 12 // 12 hours

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error(
      'SESSION_SECRET env var is not set. Generate one with `openssl rand -base64 32` and add it in Vercel project settings.'
    )
  }
  return new TextEncoder().encode(secret)
}

// Creates a signed JWT for a logged-in user. Payload should be small — just
// username + role, never the password hash.
export async function createSessionToken({ username, role }) {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
    .sign(getSecretKey())
}

// Verifies a session token. Returns the payload ({username, role}) or null
// if missing/invalid/expired. Never throws.
export async function verifySessionToken(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return { username: payload.username, role: payload.role }
  } catch {
    return null
  }
}

// Builds the Set-Cookie header value for logging in.
export function buildSessionCookie(token) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE}`,
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

// Builds the Set-Cookie header value for logging out (expires immediately).
export function buildLogoutCookie() {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

// Reads the raw cookie value out of a Node request's cookie header string.
export function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}
