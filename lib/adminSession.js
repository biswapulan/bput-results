import { SignJWT, jwtVerify } from 'jose'

export const ADMIN_SESSION_COOKIE = 'bput_admin_session'
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET env var is not set.')
  }
  return new TextEncoder().encode(secret)
}

export async function createAdminSessionToken() {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE)
    .sign(getSecretKey())
}

export async function verifyAdminSessionToken(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload.admin === true ? { admin: true } : null
  } catch {
    return null
  }
}

export function buildAdminSessionCookie(token) {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${ADMIN_SESSION_MAX_AGE}`,
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function buildAdminLogoutCookie() {
  const parts = [`${ADMIN_SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}
