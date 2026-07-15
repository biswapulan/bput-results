import Head from 'next/head'
import { useRouter } from 'next/router'
import BulkChecker from '../components/BulkChecker'
import { readCookie, verifySessionToken, SESSION_COOKIE } from '../lib/session'

const SESSIONS = [
  'Even-(2025-26)',
  'Odd-(2025-26)',
  'Even-(2024-25)',
  'Odd-(2024-25)',
  'Even-(2023-24)',
  'Odd-(2023-24)',
]

export async function getServerSideProps({ req }) {
  // Belt-and-suspenders: middleware already redirects unauthenticated users
  // away from this page, but we also check here so the page never renders
  // without a valid session (e.g. if middleware config ever changes).
  const token = readCookie(req.headers.cookie, SESSION_COOKIE)
  const session = await verifySessionToken(token)
  if (!session) {
    return { redirect: { destination: '/login?next=/bulk', permanent: false } }
  }
  return { props: { username: session.username, role: session.role } }
}

export default function BulkPage({ username, role }) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      <Head>
        <title>Class Sweep — BPUT Result</title>
      </Head>
      <div className="page-bg">
        <div style={{ maxWidth: 520, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-500, #6b7280)' }}>
            Logged in as <strong>{username}</strong> ({role})
          </span>
          <button className="back-btn" onClick={handleLogout}>Log out →</button>
        </div>
        <BulkChecker sessions={SESSIONS} onBack={() => router.push('/')} />
      </div>
    </>
  )
}
