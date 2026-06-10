import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const SESSIONS = [
  'Even-(2025-26)',
  'Odd-(2025-26)',
  'Even-(2024-25)',
  'Odd-(2024-25)',
  'Even-(2023-24)',
  'Odd-(2023-24)',
]

export default function Home() {
  const router = useRouter()
  const [rollNo, setRollNo]   = useState('')
  const [session, setSession] = useState(SESSIONS[0])
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e && e.preventDefault()
    const roll = rollNo.trim().toUpperCase()
    if (!roll) return setError('Please enter your roll number.')
    if (!/^\d{10}$/.test(roll)) return setError('Please enter a valid 10-digit registration number.')
    setError('')
    setLoading(true)
    router.push(`/result/${encodeURIComponent(roll)}?session=${encodeURIComponent(session)}`)
  }

  return (
    <>
      <Head>
        <title>BPUT Result — bputnotes.in</title>
      </Head>

      {/* ========== TICKER BAR START — update text below when result is released ========== */}
      <div className="ticker-bar">
        <div className="ticker-track">
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
        </div>
      </div>
      {/* ========== TICKER BAR END ========== */}

      <div className="page-bg">
        <div className="card fade-up">

          {/* Banner */}
          <div className="banner-wrap">
            <img
              src="/bputnotes-banner.png"
              alt="BPUTNotes"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>

          <div className="card-body">
            <div className="tag">Result Portal</div>

            <h1 className="headline">
              Check Your<br />
              <em>BPUT Result</em>
            </h1>
            <p className="subtext">
              Enter your registration number to view your latest semester result instantly.
            </p>

            <div className="field">
              <label>Registration Number</label>
              <input
                type="text"
                placeholder="e.g. 2101288157"
                value={rollNo}
                onChange={e => { setRollNo(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                maxLength={15}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>

            <div className="field">
              <label>Exam Session</label>
              <div className="select-wrap">
                <select value={session} onChange={e => setSession(e.target.value)}>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" />Fetching…</> : 'Get My Result →'}
            </button>
          </div>
        </div>

        {/* Floating CTA */}
        <a
          href="https://bputnotes.in"
          target="_blank"
          rel="noreferrer"
          className="floating-cta"
        >
          Visit bputnotes.in →
        </a>

        {/* Footer attribution */}
        <div className="stat-bar">
          <p>
            Made by{' '}
            <a href="https://bputnotes.in" target="_blank" rel="noreferrer">bputnotes.in</a>
          </p>
          <p>
            Content owned by{' '}
            <a href="https://www.bput.ac.in/" target="_blank" rel="noreferrer">BPUT Odisha</a>
          </p>
        </div>
      </div>
    </>
  )
}