import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

const gradeColor = (g) => {
  if (!g) return { bg: '#f1f5f9', color: '#94a3b8' }
  if (g === 'O') return { bg: '#dcfce7', color: '#16a34a' }
  if (g === 'E') return { bg: '#d1fae5', color: '#059669' }
  if (g === 'A') return { bg: '#dbeafe', color: '#2563eb' }
  if (g === 'B') return { bg: '#ede9fe', color: '#7c3aed' }
  if (g === 'C') return { bg: '#fef9c3', color: '#b45309' }
  if (g === 'D') return { bg: '#ffedd5', color: '#ea580c' }
  if (g === 'F') return { bg: '#fee2e2', color: '#dc2626' }
  return { bg: '#f1f5f9', color: '#64748b' }
}

const GRADE_LABELS = [
  ['O','Outstanding'], ['E','Excellent'], ['A','Very Good'],
  ['B','Good'], ['C','Average'], ['D','Pass'], ['F','Fail']
]

export default function ResultPage() {
  const router = useRouter()
  const { rollNo } = router.query
  const session = router.query.session || ''

  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [copying, setCopying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const shareCardRef = useRef(null)

  useEffect(() => {
    if (!rollNo || !session) return
    fetchResult()
  }, [rollNo, session])

  const fetchResult = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/bput-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo, dob: '2000-01-01', session }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Failed to fetch result.')
      setResult(data)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const handleCopyLink = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const handleDownloadImage = async () => {
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const card = document.getElementById('share-card')
      card.style.left = '0'
      card.style.top = '0'
      card.style.position = 'fixed'
      card.style.zIndex = '9999'
      await new Promise(r => setTimeout(r, 100))
      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      card.style.left = '-9999px'
      card.style.position = 'fixed'
      const link = document.createElement('a')
      link.download = `BPUT_Result_${rollNo}_${session}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const printArea = document.getElementById('result-print-area')
      const canvas = await html2canvas(printArea, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`BPUT_Result_${rollNo}_${session}.pdf`)
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <Head>
        <title>
          {result ? `${result.summary.studentName || rollNo} — BPUT Result` : 'BPUT Result — bputnotes.in'}
        </title>
      </Head>

      <div className="result-page">
        <div className="result-wrap">

          {/* Back button */}
          <Link href="/" className="back-btn">
            ← Back to Search
          </Link>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ display: 'inline-block', width: 40, height: 40, border: '3.5px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 16 }} />
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Fetching from BPUT…</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>😕</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: 'var(--gray-900)' }}>Result Not Found</div>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: 20 }}>{error}</p>
              <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--blue)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                Try Again
              </Link>
            </div>
          )}

          {/* Result */}
          {!loading && result && (
            <>
              {/* Action buttons */}
              <div className="actions-bar fade-up">
                <button className="btn-outline" onClick={handlePrint}>
                  🖨️ Print
                </button>
                <button className="btn-outline" onClick={handleDownloadPDF} disabled={downloading}>
                  📄 Save PDF
                </button>
                <button className="btn-outline" onClick={handleDownloadImage} disabled={downloading}>
                  🖼️ Share Card
                </button>
                <button className="btn-outline" onClick={handleCopyLink}>
                  {copying ? '✅ Copied!' : '🔗 Copy Link'}
                </button>
              </div>

              {/* Printable / capturable area */}
              <div id="result-print-area">

                {/* Hero card */}
                <div className="result-hero fade-up fade-up-1">
                  <div className="hero-top">Biju Patnaik University of Technology</div>
                  <div className="hero-name">{result.summary.studentName || rollNo}</div>
                  <div className="hero-meta">
                    <div className="hero-meta-item">
                      <label>Reg. No</label>
                      <span style={{ fontFamily: 'monospace' }}>{result.summary.rollNo}</span>
                    </div>
                    <div className="hero-meta-item">
                      <label>Branch</label>
                      <span>{result.summary.branchName}</span>
                    </div>
                    <div className="hero-meta-item">
                      <label>Semester</label>
                      <span>Semester {result.summary.semester}</span>
                    </div>
                    <div className="hero-meta-item">
                      <label>Session</label>
                      <span>{session}</span>
                    </div>
                  </div>

                  {result.sgpa?.sgpa && (
                    <div className="sgpa-badge">
                      <label>SGPA</label>
                      <div className="sgpa-val">{result.sgpa.sgpa}</div>
                      <div className="sgpa-credits">{result.sgpa.cretits} Credits</div>
                    </div>
                  )}
                </div>

                {/* Subjects table */}
                <div className="table-card fade-up fade-up-2">
                  <div className="table-header">
                    <div className="table-title">Subject-wise Results</div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Code</th>
                          <th>Subject</th>
                          <th>Type</th>
                          <th>Credits</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.grades.map((g, i) => {
                          const gc = gradeColor(g.grade)
                          return (
                            <tr key={i}>
                              <td style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>{i + 1}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: '0.8rem' }}>{g.subjectCODE}</td>
                              <td style={{ fontWeight: 500 }}>{g.subjectName}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: g.subjectType === 'P' ? '#059669' : '#2563eb' }}>
                                  {g.subjectType === 'P' ? 'Practical' : 'Theory'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, textAlign: 'center' }}>{g.subjectCredits}</td>
                              <td>
                                <span className="grade-pill" style={{ background: gc.bg, color: gc.color }}>
                                  {g.grade || '—'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {result.sgpa && (
                        <tfoot>
                          <tr>
                            <td colSpan={4} style={{ color: 'var(--gray-600)' }}>Total</td>
                            <td style={{ textAlign: 'center', color: 'var(--blue-dark)' }}>{result.sgpa.cretits}</td>
                            <td style={{ textAlign: 'center', color: '#2563eb', fontSize: '0.95rem' }}>
                              SGPA: {result.sgpa.sgpa}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Legend */}
                <div className="legend-card fade-up fade-up-3">
                  <div className="legend-title">Grade Scale</div>
                  <div className="legend-items">
                    {GRADE_LABELS.map(([g, label]) => {
                      const gc = gradeColor(g)
                      return (
                        <div className="legend-item" key={g}>
                          <div className="legend-dot" style={{ background: gc.bg, color: gc.color }}>{g}</div>
                          <span className="legend-label">{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="result-footer fade-up fade-up-4">
                Powered by <a href="https://bputnotes.in" target="_blank" rel="noreferrer">bputnotes.in</a>
                {' '}— Your BPUT companion
              </div>

              {/* Hidden share card for screenshot */}
              <div id="share-card" ref={shareCardRef}>
                <div className="share-card-header">
                  <div className="share-card-logo">bputnotes.in • BPUT Result</div>
                  <div className="share-card-name">{result.summary.studentName || rollNo}</div>
                  <div className="share-card-roll">{result.summary.rollNo} • {result.summary.branchName}</div>
                </div>
                <div className="share-card-body">
                  <div className="share-card-sgpa-row">
                    <div>
                      <div className="share-sgpa-label">SGPA</div>
                      <div className="share-sgpa-big">{result.sgpa?.sgpa || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginBottom: 4 }}>Credits Earned</div>
                      <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--gray-900)' }}>{result.sgpa?.cretits || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4 }}>Semester {result.summary.semester} • {session}</div>
                    </div>
                  </div>
                  <div className="share-card-meta">
                    <div className="share-meta-item">
                      <label>Branch</label>
                      <span>{result.summary.branchName}</span>
                    </div>
                    <div className="share-meta-item">
                      <label>Semester</label>
                      <span>Semester {result.summary.semester}</span>
                    </div>
                  </div>
                  <div className="share-grades">
                    {result.grades.slice(0, 7).map((g, i) => {
                      const gc = gradeColor(g.grade)
                      return (
                        <div className="share-grade-row" key={i}>
                          <span className="share-grade-name">{g.subjectName}</span>
                          <span className="share-grade-pill" style={{ background: gc.bg, color: gc.color }}>{g.grade || '—'}</span>
                        </div>
                      )
                    })}
                    {result.grades.length > 7 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4 }}>+{result.grades.length - 7} more subjects</div>
                    )}
                  </div>
                </div>
                <div className="share-card-footer">
                  <div className="share-watermark">bputnotes.in</div>
                  <div className="share-date">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </>
  )
}
