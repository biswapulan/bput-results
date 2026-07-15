import { NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from './lib/session'
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from './lib/adminSession'

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // Admin panel's data API uses its own, separate admin session cookie.
  if (pathname.startsWith('/api/admin/users')) {
    const adminToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
    const adminSession = await verifyAdminSessionToken(adminToken)
    if (adminSession) return NextResponse.next()
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 })
  }

  // CR/faculty bulk-checker session.
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)

  if (session) return NextResponse.next()

  // Not logged in / invalid or expired session.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/bulk', '/api/bulk-result', '/api/admin/users'],
}
