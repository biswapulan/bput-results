import { useState, useRef, useEffect } from 'react'

const MAX_RANGE = 100

function InstructionsModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="How to use Class Sweep">
        <div className="modal-header">
          <div className="modal-header-tag">📋 Before you sweep</div>
          <div className="modal-header-title">How does<br /><em>Class Sweep work?</em></div>
        </div>
        <div className="modal-body">
          <div className="modal-example-box">
            <div className="modal-example-label">Your roll number looks like this</div>
            <div className="modal-roll-display">
              <span className="roll-prefix-part">2101288</span>
              <span className="roll-suffix-part">157</span>
            </div>
            <div className="modal-roll-legend">
              <span className="legend-prefix">First 7 digits — same for your whole class</span>
              <span className="legend-suffix">Last 3 — unique per student</span>
            </div>
          </div>
          <div className="modal-steps">
            <div className="modal-step">
              <div className="modal-step-num">1</div>
              <div className="modal-step-text">
                <strong>Find the 7-digit prefix</strong> — look at any classmate's roll number and take the first 7 digits. Example: <code>2101288</code>
              </div>
            </div>
            <div className="modal-step">
              <div className="modal-step-num">2</div>
              <div className="modal-step-text">
                <strong>Enter the suffix range</strong> — the last 3 digits only. If your class goes from <code>2101288101</code> to <code>2101288160</code>, enter Start <code>101</code> and End <code>160</code>.
                <br />
                <span className="warn">⚠ Do NOT enter the full 10-digit number in the suffix box.</span>
              </div>
            </div>
            <div className="modal-step">
              <div className="modal-step-num">3</div>
              <div className="modal-step-text">
                <strong>Max 100 roll numbers per sweep.</strong> If your range is larger, split it — e.g. 1–100, then 101–200.
              </div>
            </div>
            <div className="modal-step">
              <div className="modal-step-num">4</div>
              <div className="modal-step-text">
                <strong>Select the correct exam session</strong> and hit <em>Sweep the Class →</em>. Results stream in live.
              </div>
            </div>
          </div>
          <div className="modal-tip">
            💡 Not all numbers in a range are in use — unregistered ones are silently skipped. Only students with a result appear in the table.
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-got-it" onClick={onClose}>Got it — let me sweep! →</button>
        </div>
      </div>
    </div>
  )
}

function downloadPDF(found, session) {
  // Pull dept + sem from first found result
  const first = found[0]
  const branchRaw = first?.summary?.branchName || ''
  const branch = branchRaw.replace('B.Tech.(', '').replace(')', '').trim() || branchRaw
  const sem = first?.summary?.semId ? `Semester ${first.summary.semId}` : ''
  const college = first?.summary?.collegeName || ''

  // Sort by rank (SGPA desc) to assign ranks, then sort by reg number for display
  const rankedByScore = [...found].sort((a, b) => parseFloat(b.sgpa) - parseFloat(a.sgpa))
  const rankMap = {}
  rankedByScore.forEach((r, i) => { rankMap[r.rollNo] = i + 1 })

  // Display order: by registration number
  const byRegNo = [...found].sort((a, b) => a.rollNo.localeCompare(b.rollNo))

  const rows = byRegNo.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.rollNo}</td>
      <td>${r.name || '—'}</td>
      <td><strong>${r.sgpa}</strong></td>
      <td>${rankMap[r.rollNo]}</td>
    </tr>`).join('')

  const logoSvg = `<svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="#2563eb"/>
    <path d="M18 46V18h15c3.5 0 6.2.9 8 2.7 1.8 1.7 2.7 3.8 2.7 6.3 0 1.7-.5 3.2-1.5 4.4-.9 1.1-2 1.8-3.2 2.2 1.7.3 3 1.2 4 2.5 1 1.3 1.5 2.9 1.5 4.8 0 2.9-1 5.1-3 6.7-2 1.6-4.8 2.4-8.5 2.4H18zm6.2-17h8.3c1.9 0 3.3-.5 4.2-1.3.9-.8 1.4-1.9 1.4-3.2 0-1.4-.5-2.5-1.4-3.2-.9-.8-2.3-1.2-4.1-1.2h-8.4v8.9zm0 12h9.2c2 0 3.5-.5 4.5-1.5 1-.9 1.5-2.2 1.5-3.7s-.5-2.8-1.5-3.7c-1-1-2.5-1.4-4.5-1.4h-9.2v10.3z" fill="white"/>
  </svg>`

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Class Result — bputnotes.in</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; background: #fff; color: #000; padding: 28px 32px; }

  /* Brand header */
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #000; }
  .brand-logo { width: 40px; height: 40px; flex-shrink: 0; }
  .brand-name { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .brand-name span { color: #2563eb; }
  .brand-sub { font-size: 11px; color: #555; margin-top: 1px; }

  /* Meta block */
  .meta { margin-bottom: 16px; }
  .meta-title { font-size: 15px; font-weight: 800; margin-bottom: 4px; }
  .meta-row { font-size: 11.5px; color: #333; margin-bottom: 2px; }
  .meta-row strong { color: #000; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1.5px solid #000; padding: 7px 10px; text-align: left; }
  th { background: #000; color: #fff; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  tr:nth-child(even) td { background: #f5f5f5; }
  td:first-child, th:first-child { width: 36px; text-align: center; }
  td:last-child, th:last-child { width: 52px; text-align: center; }
  td:nth-child(4), th:nth-child(4) { width: 70px; text-align: center; }
  td strong { font-weight: 700; }

  /* Footer */
  .footer { margin-top: 20px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; display: flex; justify-content: space-between; }

  @media print {
    body { padding: 18px 22px; }
    @page { margin: 15mm; }
  }
</style>
</head>
<body>

<div class="brand">
  <div class="brand-logo">${logoSvg}</div>
  <div>
    <div class="brand-name">BPUT<span>Notes</span>.in</div>
    <div class="brand-sub">Result Portal — bputnotes.in</div>
  </div>
</div>

<div class="meta">
  <div class="meta-title">Class Result Summary</div>
  ${branch ? `<div class="meta-row"><strong>Branch:</strong> ${branch}</div>` : ''}
  ${sem    ? `<div class="meta-row"><strong>Semester:</strong> ${sem}</div>` : ''}
  ${college ? `<div class="meta-row"><strong>College:</strong> ${college}</div>` : ''}
  <div class="meta-row"><strong>Session:</strong> ${session}</div>
  <div class="meta-row"><strong>Total Students:</strong> ${byRegNo.length}</div>
</div>

<table>
  <thead>
    <tr>
      <th>Sl No</th>
      <th>Reg No</th>
      <th>Name</th>
      <th>SGPA</th>
      <th>Rank</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="footer">
  <span>Generated by bputnotes.in</span>
  <span>Data source: results.bput.ac.in</span>
</div>

<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Allow popups for this site to download PDF.'); return }
  win.document.write(html)
  win.document.close()
}

const sgpaColor = (s) => {
  const v = parseFloat(s)
  if (v >= 8.5) return '#16a34a'
  if (v >= 7)   return '#2563eb'
  if (v >= 5.5) return '#d97706'
  return '#dc2626'
}

export default function BulkChecker({ sessions, onBack }) {
  const [showModal, setShowModal] = useState(true)
  const [session, setSession]     = useState(sessions[0])
  const [prefix, setPrefix]       = useState('')
  const [from, setFrom]           = useState('')
  const [to, setTo]               = useState('')
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [total, setTotal]         = useState(0)
  const [error, setError]         = useState('')
  const [helpOpen, setHelpOpen]   = useState(false)
  const abortRef                  = useRef(false)
  const helpRef                   = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const validate = () => {
    const p = prefix.trim()
    const f = parseInt(from, 10)
    const t = parseInt(to, 10)
    if (!p || p.length !== 7 || !/^\d{7}$/.test(p))
      return 'Enter the first 7 digits of the roll number (e.g. 2101288).'
    if (isNaN(f) || isNaN(t))
      return 'Enter valid start and end suffixes (last 3 digits only, e.g. 101 to 160).'
    if (f < 0 || t < 0)
      return 'Suffix values must be 0 or above.'
    if (f > t)
      return 'Start suffix must be less than or equal to end suffix.'
    if (t - f + 1 > MAX_RANGE)
      return `Range too large — max ${MAX_RANGE} per sweep. Try ${f}–${f + MAX_RANGE - 1}, then ${f + MAX_RANGE} onwards.`
    return null
  }

  const buildRolls = () => {
    const p = prefix.trim()
    const f = parseInt(from, 10)
    const t = parseInt(to, 10)
    const rolls = []
    for (let i = f; i <= t; i++)
      rolls.push({ rollNo: `${p}${String(i).padStart(3, '0')}`, name: '' })
    return rolls
  }

  const handleFetch = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    const rolls = buildRolls()
    setTotal(rolls.length)
    setProgress(0)
    setResults([])
    setLoading(true)
    abortRef.current = false
    const BATCH = 5
    for (let i = 0; i < rolls.length; i += BATCH) {
      if (abortRef.current) break
      const batch = rolls.slice(i, i + BATCH)
      try {
        const res  = await fetch('/api/bulk-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNumbers: batch, session }),
        })
        const data = await res.json()
        if (data.results) setResults(r => [...r, ...data.results])
      } catch { /* partial failure — continue */ }
      setProgress(Math.min(i + BATCH, rolls.length))
    }
    setLoading(false)
  }

  const handleStop = () => { abortRef.current = true }

  const found    = results.filter(r => r.sgpa !== null)
  const notFound = results.filter(r => r.sgpa === null)
  const sorted   = [...found].sort((a, b) => parseFloat(b.sgpa) - parseFloat(a.sgpa))

  return (
    <>
      {showModal && <InstructionsModal onClose={() => setShowModal(false)} />}

      <div className="bulk-wrap fade-up">
        {/* ── Form card ── */}
        <div className="card" style={{ maxWidth: 520, width: '100%' }}>
          <div className="banner-wrap">
            <img src="/bputnotes-banner.png" alt="BPUTNotes" onError={e => { e.target.style.display = 'none' }} />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <button className="back-btn" onClick={onBack}>← Back</button>
              <button className="modal-reopen-btn" onClick={() => setShowModal(true)}>❓ How to use</button>
            </div>

            <div className="tag bulk-tag">Class Sweep</div>
            <h1 className="headline">The Whole<br /><em>Squad's Results</em></h1>
            <p className="subtext">Enter your class roll range to fetch everyone's SGPA at once.</p>

            <div className="field">
              <label>7-digit Roll Prefix (same for whole class)</label>
              <input
                type="text" placeholder="e.g. 2101288"
                value={prefix}
                onChange={e => { setPrefix(e.target.value.replace(/\D/g, '')); setError('') }}
                maxLength={7} autoComplete="off" spellCheck={false}
              />
            </div>

            <div className="range-row">
              <div className="field" style={{ flex: 1 }}>
                <label>Suffix Start</label>
                <input type="number" placeholder="e.g. 101" value={from} min={0} max={999}
                  onChange={e => { setFrom(e.target.value); setError('') }} />
              </div>
              <div className="range-sep">to</div>
              <div className="field" style={{ flex: 1 }}>
                <label>Suffix End</label>
                <input type="number" placeholder="e.g. 160" value={to} min={0} max={999}
                  onChange={e => { setTo(e.target.value); setError('') }} />
              </div>
            </div>

            <div className="field">
              <label>Exam Session</label>
              <div className="select-wrap">
                <select value={session} onChange={e => setSession(e.target.value)}>
                  {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {!loading ? (
              <button className="btn-primary" onClick={handleFetch}>Sweep the Class →</button>
            ) : (
              <div>
                <div className="bulk-progress-wrap">
                  <div className="bulk-progress-bar" style={{ width: `${total ? (progress / total) * 100 : 0}%` }} />
                </div>
                <div className="bulk-progress-label">Fetching {progress} / {total} roll numbers…</div>
                <button className="btn-stop" onClick={handleStop}>Stop</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {results.length > 0 && (
          <div className="card" style={{ maxWidth: 520, width: '100%', marginTop: 16 }}>
            <div className="card-body" style={{ padding: '20px 20px 24px' }}>

              {/* Need Help bar */}
              <div style={{ marginBottom: 16 }}>
                <div className="rp-help-wrap" ref={helpRef}>
                  <button className="rp-help-btn" onClick={() => setHelpOpen(v => !v)}>
                    Need Help
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path
                        d={helpOpen ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'}
                        stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {helpOpen && (
                    <div className="rp-help-dropdown">
                      <span className="rp-help-label">How can we help?</span>
                      <a
                        href="mailto:students@bput.ac.in?subject=Issue with BPUT Result"
                        className="rp-help-item"
                        onClick={() => setHelpOpen(false)}
                      >
                        <div className="rp-help-ico mail">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        </div>
                        <div className="rp-help-text">
                          <strong>Issue with Result</strong>
                          <span>Email BPUT — students@bput.ac.in</span>
                        </div>
                      </a>
                      <a
                        href="https://wa.me/918249185682?text=Hi%2C+I+have+an+issue+with+the+bputnotes.in+result+portal."
                        target="_blank"
                        rel="noreferrer"
                        className="rp-help-item"
                        onClick={() => setHelpOpen(false)}
                      >
                        <div className="rp-help-ico wa">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>
                        <div className="rp-help-text">
                          <strong>Issue with Website</strong>
                          <span>WhatsApp our admin</span>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="bulk-stats-row">
                <div className="bulk-stat">
                  <span className="bulk-stat-num">{results.length}</span>
                  <span className="bulk-stat-lbl">Checked</span>
                </div>
                <div className="bulk-stat">
                  <span className="bulk-stat-num" style={{ color: '#16a34a' }}>{found.length}</span>
                  <span className="bulk-stat-lbl">Found</span>
                </div>
                <div className="bulk-stat">
                  <span className="bulk-stat-num" style={{ color: '#dc2626' }}>{notFound.length}</span>
                  <span className="bulk-stat-lbl">Not Found</span>
                </div>
                {found.length > 0 && (
                  <div className="bulk-stat">
                    <span className="bulk-stat-num" style={{ color: '#2563eb' }}>
                      {(found.reduce((s, r) => s + parseFloat(r.sgpa), 0) / found.length).toFixed(2)}
                    </span>
                    <span className="bulk-stat-lbl">Avg SGPA</span>
                  </div>
                )}
              </div>

              {/* Download PDF button — only when fetch is done */}
              {!loading && sorted.length > 0 && (
                <button className="bulk-pdf-btn" onClick={() => downloadPDF(found, session)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF Result Sheet
                </button>
              )}

              {/* Table */}
              {sorted.length > 0 && (
                <table className="bulk-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>SGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r, i) => (
                      <tr key={r.rollNo}>
                        <td className="rank-cell">{i + 1}</td>
                        <td>
                          <a href={`/result/${r.rollNo}?session=${encodeURIComponent(session)}`}
                            target="_blank" rel="noreferrer" className="roll-link">
                            {r.rollNo}
                          </a>
                        </td>
                        <td className="name-cell">{r.name || <span className="dim">—</span>}</td>
                        <td>
                          <span className="sgpa-pill" style={{
                            background: sgpaColor(r.sgpa) + '18',
                            color: sgpaColor(r.sgpa),
                            border: `1.5px solid ${sgpaColor(r.sgpa)}30`
                          }}>
                            {r.sgpa}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {notFound.length > 0 && (
                <details className="not-found-details">
                  <summary>{notFound.length} roll number{notFound.length > 1 ? 's' : ''} with no result</summary>
                  <div className="not-found-list">
                    {notFound.map(r => <span key={r.rollNo} className="not-found-pill">{r.rollNo}</span>)}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
