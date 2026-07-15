import { NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from './lib/session'

export async function middleware(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)

  if (session) return NextResponse.next()

  // Not logged in / invalid or expired session.
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/bulk', '/api/bulk-result'],
}
