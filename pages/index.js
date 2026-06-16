import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import BulkChecker from '../components/BulkChecker'

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
  const [mode, setMode] = useState(null) // null | 'solo' | 'bulk'
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

      {/* TICKER */}
      <div className="ticker-bar">
        <div className="ticker-track">
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
          <span className="ticker-item">✦ Even Semester 2025-26 results are OUT !!! Check Now</span>
        </div>
      </div>

      <div className="page-bg">

        {/* ── MODE PICKER ── */}
        {mode === null && (
          <div className="card fade-up" style={{ maxWidth: 500 }}>
            <div className="banner-wrap">
              <img src="/bputnotes-banner.png" alt="BPUTNotes" onError={e => { e.target.style.display = 'none' }} />
            </div>
            <div className="card-body">
              <div className="tag">Result Portal</div>
              <h1 className="headline">
                How do you want<br />
                <em>to check results?</em>
              </h1>
              <p className="subtext">Pick your mode — quick solo lookup or squad-wide sweep.</p>

              <div className="mode-grid">
                <button className="mode-card" onClick={() => setMode('solo')}>
                  <div className="mode-icon solo-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <div className="mode-label">Just Me</div>
                  <div className="mode-desc">Check your own result in seconds. Enter roll number, get SGPA.</div>
                  <div className="mode-badge">Solo Lookup →</div>
                </button>

                <button className="mode-card" onClick={() => setMode('bulk')}>
                  <div className="mode-icon bulk-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/>
                      <path d="M1 20c0-3.3 3.1-6 7-6h2"/><path d="M14 20c0-2.8 2.3-5 5-5s5 2.2 5 5"/>
                    </svg>
                  </div>
                  <div className="mode-label">The Whole Squad</div>
                  <div className="mode-desc">Fetch results for your entire class at once. Compare SGPAs side by side.</div>
                  <div className="mode-badge bulk-badge">Class Sweep →</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SOLO MODE ── */}
        {mode === 'solo' && (
          <div className="card fade-up">
            <div className="banner-wrap">
              <img src="/bputnotes-banner.png" alt="BPUTNotes" onError={e => { e.target.style.display = 'none' }} />
            </div>
            <div className="card-body">
              <button className="back-btn" onClick={() => { setMode(null); setError('') }} style={{ display: 'block', marginBottom: 12 }}>
                ← Back
              </button>
              <div className="tag">Solo Lookup</div>
              <h1 className="headline">
                Check Your<br />
                <em>BPUT Result</em>
              </h1>
              <p className="subtext">Enter your registration number to view your latest semester result instantly.</p>

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
        )}

        {/* ── BULK MODE ── */}
        {mode === 'bulk' && (
          <BulkChecker sessions={SESSIONS} onBack={() => setMode(null)} />
        )}

        {/* Floating CTA */}
        <a href="https://bputnotes.in" target="_blank" rel="noreferrer" className="floating-cta">
          Visit bputnotes.in →
        </a>

        {/* Footer */}
        <div className="stat-bar">
          <p>Made by{' '}<a href="https://bputnotes.in" target="_blank" rel="noreferrer">bputnotes.in</a></p>
          <p>Content owned by{' '}<a href="https://www.bput.ac.in/" target="_blank" rel="noreferrer">BPUT Odisha</a></p>
        </div>
      </div>
    </>
  )
}
