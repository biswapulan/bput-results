import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const WHATSAPP_LINK = 'https://wa.me/918249185682?text=Hi%2C+I%27m+a+CR%2Ffaculty+member+and+I%27d+like+access+to+the+Class+Sweep+(bulk+result)+tool.'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e && e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed.')
        setLoading(false)
        return
      }
      const next = typeof router.query.next === 'string' ? router.query.next : '/bulk'
      router.push(next)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>CR / Faculty Login — BPUT Result</title>
      </Head>
      <div className="page-bg">
        <div className="card fade-up" style={{ maxWidth: 440 }}>
          <div className="banner-wrap">
            <img src="/bputnotes-banner.png" alt="BPUTNotes" onError={e => { e.target.style.display = 'none' }} />
          </div>
          <div className="card-body">
            <button className="back-btn" onClick={() => router.push('/')} style={{ display: 'block', marginBottom: 12 }}>
              ← Back
            </button>
            <div className="tag bulk-tag">CR / Faculty Access</div>
            <h1 className="headline">
              Log in to<br /><em>Class Sweep</em>
            </h1>
            <p className="subtext">
              Bulk result checking is restricted to verified Class Representatives and faculty.
            </p>

            <div className="field">
              <label>Username</label>
              <input
                type="text"
                placeholder="your username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                autoComplete="username"
                spellCheck={false}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" />Logging in…</> : 'Log In →'}
            </button>

            <p className="subtext" style={{ marginTop: 18, fontSize: 13 }}>
              Don't have an account? Access is only given to verified CRs and faculty.
              <br />
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                Message us on WhatsApp to get verified →
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
