import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

const isFailGrade = (g) => g && (g === 'F' || g.startsWith('F('))

const gradeColor = (g) => {
  if (!g) return { bg: 'rgba(241,245,249,0.6)', color: '#94a3b8', border: 'rgba(148,163,184,0.15)' }
  if (g === 'O') return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
  if (g === 'E') return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
  if (g === 'A') return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
  if (g === 'B') return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' }
  if (g === 'C') return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
  if (g === 'D') return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }
  if (isFailGrade(g)) return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' }
}

const GRADE_LABELS = [
  ['O','Outstanding'],['E','Excellent'],['A','Very Good'],
  ['B','Good'],['C','Average'],['D','Pass'],['F','Fail']
]

const LOADING_MESSAGES = [
  'Connecting to BPUT servers…',
  'Fetching your result data…',
  'Crunching your grades…',
  'Almost there, hang tight…',
]

const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const PdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function ResultPage() {
  const router = useRouter()
  const { rollNo } = router.query
  const session = router.query.session || ''

  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [copying, setCopying]         = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loadingMsg, setLoadingMsg]   = useState(0)
  const [helpOpen, setHelpOpen]       = useState(false)
  const msgIntervalRef                = useRef(null)
  const helpRef                       = useRef(null)

  const startMsgs = () => {
    setLoadingMsg(0)
    msgIntervalRef.current = setInterval(
      () => setLoadingMsg(m => (m + 1) % LOADING_MESSAGES.length),
      1800
    )
  }
  const stopMsgs = () => { if (msgIntervalRef.current) clearInterval(msgIntervalRef.current) }

  const fetchResult = useCallback(async (attempt = 0) => {
    if (!rollNo || !session) return
    setLoading(true); setError(''); startMsgs()
    try {
      const res  = await fetch('/api/bput-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo, dob: '2000-01-01', session }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (attempt < 1) { stopMsgs(); setLoading(false); setTimeout(() => fetchResult(attempt + 1), 2000); return }
        return setError(data.error || 'Failed to fetch result.')
      }
      setResult(data)
    } catch {
      if (attempt < 1) { stopMsgs(); setLoading(false); setTimeout(() => fetchResult(attempt + 1), 2000); return }
      setError('Network error. Please check your connection and try again.')
    } finally { stopMsgs(); setLoading(false) }
  }, [rollNo, session])

  useEffect(() => {
    if (!rollNo || !session) return
    fetchResult(0)
    return () => stopMsgs()
  }, [rollNo, session, fetchResult])

  useEffect(() => {
    const handler = (e) => {
      if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopying(true); setTimeout(() => setCopying(false), 2000)
  }

  const handleDownloadImage = async () => {
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const card = document.getElementById('share-card')
      card.style.visibility = 'visible'; card.style.opacity = '1'
      await new Promise(r => setTimeout(r, 120))
      const canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      card.style.visibility = 'hidden'; card.style.opacity = '0'
      const link = document.createElement('a')
      link.download = `BPUT_Result_${rollNo}_${session}.png`
      link.href = canvas.toDataURL('image/png'); link.click()
    } catch (e) { console.error(e) } finally { setDownloading(false) }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W      = 210
      const M      = 16   // margin
      const COL    = W - M * 2
      let y        = 0

      // ── colour helpers ──────────────────────────────────────────
      const rgb = (hex) => [
        parseInt(hex.slice(1,3),16),
        parseInt(hex.slice(3,5),16),
        parseInt(hex.slice(5,7),16),
      ]
      const fill   = (hex) => { const [r,g,b] = rgb(hex); pdf.setFillColor(r,g,b) }
      const stroke = (hex) => { const [r,g,b] = rgb(hex); pdf.setDrawColor(r,g,b) }
      const txt    = (hex) => { const [r,g,b] = rgb(hex); pdf.setTextColor(r,g,b) }

      const gradeC = (g) => {
        if (!g)            return { bg:'#f1f5f9', fg:'#64748b' }
        if (g==='O')       return { bg:'#dcfce7', fg:'#15803d' }
        if (g==='E')       return { bg:'#d1fae5', fg:'#065f46' }
        if (g==='A')       return { bg:'#dbeafe', fg:'#1d4ed8' }
        if (g==='B')       return { bg:'#ede9fe', fg:'#5b21b6' }
        if (g==='C')       return { bg:'#fef3c7', fg:'#92400e' }
        if (g==='D')       return { bg:'#ffedd5', fg:'#9a3412' }
        if (isFailGrade(g))return { bg:'#fee2e2', fg:'#991b1b' }
        return               { bg:'#f1f5f9', fg:'#475569' }
      }

      const cleanBranch = (s) => {
        if (!s) return '—'
        return s.replace(/B\.Tech\.\s*\(/gi,'').replace(/\)\s*$/,'').trim() || s
      }

      // ════════════════════════════════════════════════════════════
      // 1.  HEADER  (navy, clean, no textures)
      // ════════════════════════════════════════════════════════════
      const H_HDR = 26
      fill('#1e3a8a')
      pdf.rect(0, 0, W, H_HDR, 'F')

      // left: wordmark
      pdf.setFont('helvetica','bold'); pdf.setFontSize(13)
      txt('#ffffff')
      pdf.text('bputnotes', M, 11)
      const ww = pdf.getTextWidth('bputnotes')
      txt('#60a5fa')
      pdf.text('.in', M + ww, 11)

      // right top: university name
      pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5)
      txt('#93c5fd')
      pdf.text('BIJU PATNAIK UNIVERSITY OF TECHNOLOGY', W - M, 9, { align:'right' })

      // right mid: "Official Result"
      pdf.setFont('helvetica','bold'); pdf.setFontSize(9)
      txt('#ffffff')
      pdf.text('Official Result', W - M, 17, { align:'right' })

      // date bottom-left
      pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5)
      txt('#93c5fd')
      const dateStr = new Date().toLocaleDateString('en-IN',{ day:'numeric', month:'long', year:'numeric' })
      pdf.text('Generated on ' + dateStr, M, 23)

      y = H_HDR + 10

      // ════════════════════════════════════════════════════════════
      // 2.  STUDENT NAME + COLLEGE + STATUS BADGE
      // ════════════════════════════════════════════════════════════
      const hasBacklog = result?.grades?.some(g => isFailGrade(g.grade))

      // Name
      pdf.setFont('helvetica','bold'); pdf.setFontSize(17)
      txt('#0f172a')
      pdf.text(result.summary.studentName || 'Student', M, y + 6)

      // Status badge — text only, no emoji
      const badgeLabel = hasBacklog ? 'BACKLOG' : 'PASSED'
      const badgeBg    = hasBacklog ? '#fee2e2' : '#dcfce7'
      const badgeFg    = hasBacklog ? '#991b1b' : '#166534'
      const badgeBdr   = hasBacklog ? '#fca5a5' : '#86efac'
      pdf.setFont('helvetica','bold'); pdf.setFontSize(7)
      const bw2 = pdf.getTextWidth(badgeLabel) + 10
      fill(badgeBg)
      pdf.roundedRect(W - M - bw2, y, bw2, 8, 1.5, 1.5, 'F')
      stroke(badgeBdr)
      pdf.setLineWidth(0.35)
      pdf.roundedRect(W - M - bw2, y, bw2, 8, 1.5, 1.5, 'S')
      txt(badgeFg)
      pdf.text(badgeLabel, W - M - bw2 / 2, y + 5.4, { align:'center' })

      y += 10

      // College
      pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
      txt('#64748b')
      const cLines = pdf.splitTextToSize(result.summary.collegeName || '—', COL - 40)
      pdf.text(cLines, M, y)
      y += cLines.length * 4.5 + 9

      // thin separator
      stroke('#e2e8f0')
      pdf.setLineWidth(0.3)
      pdf.line(M, y, W - M, y)
      y += 8

      // ════════════════════════════════════════════════════════════
      // 3.  SGPA BAND  (clean dark band, no floating circle)
      // ════════════════════════════════════════════════════════════
      const BAND_H = 22
      fill('#1e3a8a')
      pdf.roundedRect(M, y, COL, BAND_H, 3, 3, 'F')

      // left accent strip
      fill('#3b82f6')
      pdf.roundedRect(M, y, 3, BAND_H, 1.5, 1.5, 'F')

      // SGPA label
      pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5)
      txt('#93c5fd')
      pdf.text('SGPA', M + 8, y + 7)

      // SGPA value
      pdf.setFont('helvetica','bold'); pdf.setFontSize(20)
      txt('#ffffff')
      pdf.text(String(result.sgpa?.sgpa ?? '—'), M + 8, y + 18)

      // right divider
      stroke('#2d52a8')
      pdf.setLineWidth(0.4)
      pdf.line(W - M - 40, y + 4, W - M - 40, y + BAND_H - 4)

      // Credits label
      pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5)
      txt('#93c5fd')
      pdf.text('CREDITS EARNED', W - M - 20, y + 7, { align:'center' })

      // Credits value
      pdf.setFont('helvetica','bold'); pdf.setFontSize(18)
      txt('#ffffff')
      pdf.text(String(result.sgpa?.cretits ?? '0'), W - M - 20, y + 18, { align:'center' })

      y += BAND_H + 9

      // ════════════════════════════════════════════════════════════
      // 4.  DETAIL TABLE  (4 rows: Reg, Session, Semester, Branch)
      // ════════════════════════════════════════════════════════════
      const details = [
        ['REG. NO.',  result.summary.rollNo],
        ['SESSION',   session],
        ['SEMESTER',  'Term ' + result.summary.semester],
        ['BRANCH',    cleanBranch(result.summary.branchName)],
      ]
      const DR_H  = 8
      const DT_H  = details.length * DR_H + 3

      stroke('#e2e8f0')
      pdf.setLineWidth(0.3)
      pdf.roundedRect(M, y, COL, DT_H, 2.5, 2.5, 'S')

      details.forEach(([label, value], i) => {
        const ry = y + 1.5 + i * DR_H

        if (i % 2 === 0) {
          fill('#f8fafc')
          if (i === 0)
            pdf.roundedRect(M + 0.4, ry, COL - 0.8, DR_H, 2, 0, 'F')
          else if (i === details.length - 1)
            pdf.roundedRect(M + 0.4, ry, COL - 0.8, DR_H, 0, 2, 'F')
          else
            pdf.rect(M + 0.4, ry, COL - 0.8, DR_H, 'F')
        }

        pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5)
        txt('#94a3b8')
        pdf.text(label, M + 5, ry + 5.5)

        const vw = COL * 0.55
        const vl = pdf.splitTextToSize(String(value ?? '—'), vw)
        pdf.setFont('helvetica','bold'); pdf.setFontSize(8)
        txt('#0f172a')
        pdf.text(vl, W - M - 4, ry + 5.5, { align:'right' })

        if (i < details.length - 1) {
          stroke('#e2e8f0')
          pdf.setLineWidth(0.2)
          pdf.line(M + 4, ry + DR_H, W - M - 4, ry + DR_H)
        }
      })

      y += DT_H + 9

      // ════════════════════════════════════════════════════════════
      // 5.  SUBJECT TABLE HEADER
      // ════════════════════════════════════════════════════════════
      pdf.setFont('helvetica','bold'); pdf.setFontSize(9)
      txt('#0f172a')
      pdf.text('Subject Breakdown', M, y)

      pdf.setFont('helvetica','normal'); pdf.setFontSize(7.5)
      txt('#64748b')
      pdf.text(result.grades.length + ' Papers', W - M, y, { align:'right' })

      y += 5

      // column header row
      const TH_H = 7
      fill('#f1f5f9')
      pdf.rect(M, y, COL, TH_H, 'F')
      stroke('#e2e8f0')
      pdf.setLineWidth(0.25)
      pdf.line(M, y + TH_H, W - M, y + TH_H)

      // column x positions
      const CX = {
        num   : M + 4,
        name  : M + 13,
        code  : M + COL * 0.56,
        cr    : M + COL * 0.73,
        grade : W - M - 2,
      }

      pdf.setFont('helvetica','bold'); pdf.setFontSize(6)
      txt('#94a3b8')
      pdf.text('NO.',    CX.num,          y + 5)
      pdf.text('SUBJECT',CX.name,         y + 5)
      pdf.text('CODE',   CX.code,         y + 5)
      pdf.text('CR',     CX.cr,           y + 5)
      pdf.text('GRADE',  CX.grade,        y + 5, { align:'right' })
      y += TH_H

      // ════════════════════════════════════════════════════════════
      // 6.  SUBJECT ROWS
      //     Fixed row height = 8.5 mm, name truncated to one line
      //     with ellipsis — keeps everything on one page
      // ════════════════════════════════════════════════════════════
      const SR_H   = 8.5
      const NAME_W = CX.code - CX.name - 4

      result.grades.forEach((g, i) => {
        const gc = gradeC(g.grade)
        const ry = y + i * SR_H

        // alternating bg
        if (i % 2 === 0) {
          fill('#f8fafc')
          pdf.rect(M, ry, COL, SR_H, 'F')
        }

        // row divider
        stroke('#e2e8f0')
        pdf.setLineWidth(0.15)
        pdf.line(M, ry + SR_H, W - M, ry + SR_H)

        const cy = ry + SR_H / 2 + 1.5   // vertical centre of row

        // number
        pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5)
        txt('#94a3b8')
        pdf.text((i+1).toString().padStart(2,'0'), CX.num, cy)

        // subject name — single line, truncate with ellipsis
        pdf.setFont('helvetica','normal'); pdf.setFontSize(7.5)
        txt('#1e293b')
        let sName = g.subjectName || '—'
        while (pdf.getTextWidth(sName) > NAME_W && sName.length > 3) {
          sName = sName.slice(0, -1)
        }
        if (sName !== g.subjectName) sName = sName.slice(0,-1) + '...'
        pdf.text(sName, CX.name, cy)

        // code
        pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5)
        txt('#64748b')
        pdf.text(g.subjectCODE || '—', CX.code, cy)

        // credits
        pdf.setFont('helvetica','bold'); pdf.setFontSize(7)
        txt('#334155')
        pdf.text(String(g.subjectCredits ?? '—'), CX.cr, cy)

        // grade badge — properly sized to text
        pdf.setFont('helvetica','bold'); pdf.setFontSize(7)
        const gradeLabel = g.grade || '—'
        const gbw = Math.max(pdf.getTextWidth(gradeLabel) + 7, 12)
        const gbh = 5.5
        const gbx = CX.grade - gbw
        const gby = ry + (SR_H - gbh) / 2
        fill(gc.bg)
        pdf.roundedRect(gbx, gby, gbw, gbh, 1.5, 1.5, 'F')
        txt(gc.fg)
        pdf.text(gradeLabel, gbx + gbw / 2, gby + gbh / 2 + 1.5, { align:'center' })
      })

      y += result.grades.length * SR_H + 8

      // ════════════════════════════════════════════════════════════
      // 7.  FOOTER  (copyright + attribution)
      // ════════════════════════════════════════════════════════════
      const FT_H = 16
      // push to bottom of page if there's room, else right after table
      const footerY = Math.max(y, 282 - FT_H)

      stroke('#e2e8f0')
      pdf.setLineWidth(0.3)
      pdf.line(M, footerY, W - M, footerY)

      // left: bputnotes.in
      pdf.setFont('helvetica','bold'); pdf.setFontSize(8)
      txt('#2563eb')
      pdf.text('bputnotes.in', M, footerY + 7)
      pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5)
      txt('#94a3b8')
      pdf.text('Your one-stop for BPUT notes, PYQs & results', M, footerY + 13)

      // right: copyright — this is the prominent part
      pdf.setFont('helvetica','bold'); pdf.setFontSize(7)
      txt('#1e3a8a')
      pdf.text('Content owned by & copyright BPUT Odisha', W - M, footerY + 7, { align:'right' })
      pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5)
      txt('#94a3b8')
      pdf.text('bput.ac.in  |  Roll: ' + result.summary.rollNo, W - M, footerY + 13, { align:'right' })

      pdf.save('BPUT_Result_' + rollNo + '_' + session + '.pdf')

    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  const hasBacklog = result?.grades?.some(g => isFailGrade(g.grade))

  return (
    <>
      <Head>
        <title>
          {result ? `${result.summary.studentName || rollNo} — BPUT Result` : 'BPUT Result — bputnotes.in'}
        </title>
      </Head>

      <div className="rp-layout">
        <div className="rp-container">

          {/* ── Top bar ── */}
          <div className="rp-topbar">
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
                    href={`mailto:students@bput.ac.in?subject=Issue with BPUT Result&body=Roll No: ${rollNo || ''}`}
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
            <Link href="/" className="rp-back-pill">← New Search</Link>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="rp-brand-loading fade-up">
              <div className="rbl-brand">
                <div className="rbl-logo-ring">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <div className="rbl-wordmark">
                  <span className="rbl-word-bput">bput</span><span className="rbl-word-notes">notes</span><span className="rbl-word-in">.in</span>
                </div>
              </div>
              <div className="rbl-spinner-wrap">
                <div className="rbl-spinner" />
              </div>
              <div className="rbl-msg-wrap">
                {LOADING_MESSAGES.map((msg, i) => (
                  <span key={msg} className={`rbl-msg ${i === loadingMsg ? 'rbl-msg-active' : ''}`}>
                    {msg}
                  </span>
                ))}
              </div>
              <p className="rbl-tagline">Your one-stop for BPUT notes, PYQs &amp; results</p>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="rp-card rp-error-state fade-up">
              <div className="rp-error-icon">✕</div>
              <div className="rp-error-title">Result Unavailable</div>
              <p className="rp-error-sub">{error}</p>
              <div className="rp-error-actions">
                <button className="rp-btn-retry" onClick={() => fetchResult(0)}>Try Again</button>
                <Link href="/" className="rp-btn-back">Search Another Roll</Link>
              </div>
            </div>
          )}

          {/* ── Main Result ── */}
          {!loading && result && (
            <div id="result-print-area" className="fade-up">

              <div className="rp-card rp-hero-card">
                <div className="rp-banner-wrap">
                  <img
                    src="/bputnotes-banner.png"
                    alt="BPUTNotes"
                    className="rp-banner-img"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
                <div className="rp-hero-text">
                  <span className="rp-hero-univ-label">Biju Patnaik University of Technology</span>
                  <h2 className="rp-hero-headline">Your Grades,<br /><em>Decoded.</em></h2>
                </div>
              </div>

              <div className="rp-card rp-result-card">
                <div className="rp-student-top">
                  <div className="rp-student-info">
                    <div className="rp-official-tag">BPUT · Official Result</div>
                    <h1 className="rp-student-name">{result.summary.studentName || 'Student'}</h1>
                    <p className="rp-student-college">{result.summary.collegeName || '—'}</p>
                  </div>
                  <span className={`rp-status-badge ${hasBacklog ? 'fail' : 'pass'}`}>
                    {hasBacklog ? '⚠ Backlog' : '✓ Passed'}
                  </span>
                </div>

                <div className="rp-sgpa-block">
                  <div className="rp-sgpa-left">
                    <div className="rp-sgpa-label">SGPA</div>
                    <div className="rp-sgpa-value">{result.sgpa?.sgpa || '—'}</div>
                  </div>
                  <div className="rp-sgpa-right">
                    <div className="rp-sgpa-credits-label">Credits Earned</div>
                    <div className="rp-sgpa-credits-val">{result.sgpa?.cretits || '0'}</div>
                  </div>
                </div>

                <div className="rp-detail-rows">
                  <div className="rp-detail-row">
                    <span className="rp-detail-label">Reg. No.</span>
                    <span className="rp-detail-val mono">{result.summary.rollNo}</span>
                  </div>
                  <div className="rp-detail-row">
                    <span className="rp-detail-label">Session</span>
                    <span className="rp-detail-val">{session}</span>
                  </div>
                  <div className="rp-detail-row">
                    <span className="rp-detail-label">Semester</span>
                    <span className="rp-detail-val">Term {result.summary.semester}</span>
                  </div>
                  <div className="rp-detail-row">
                    <span className="rp-detail-label">Branch</span>
                    <span className="rp-detail-val">
                      {result.summary.branchName?.replace('B.Tech.(','').replace(')','') || '—'}
                    </span>
                  </div>
                </div>

                <div className="rp-section-divider">
                  <span>Subject Breakdown</span>
                  <span className="rp-grade-count">{result.grades.length} Papers</span>
                </div>

                <div className="rp-subject-list">
                  {result.grades.map((g, i) => {
                    const gc = gradeColor(g.grade)
                    return (
                      <div className="rp-subject-row" key={i}>
                        <span className="rp-subject-num">{(i+1).toString().padStart(2,'0')}</span>
                        <div className="rp-subject-info">
                          <h4 className="rp-subject-name">{g.subjectName}</h4>
                          <div className="rp-subject-meta">
                            <span className="rp-subject-code">{g.subjectCODE}</span>
                            <span className="rp-dot">·</span>
                            <span>{g.subjectCredits} Cr</span>
                          </div>
                        </div>
                        <div className="rp-grade-badge" style={{ background:gc.bg, color:gc.color, borderColor:gc.border }}>
                          {g.grade || '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="rp-legend">
                  <span className="rp-legend-title">Scale</span>
                  <div className="rp-legend-row">
                    {GRADE_LABELS.map(([g, label]) => {
                      const gc = gradeColor(g)
                      return (
                        <div key={g} className="rp-legend-pill"
                          style={{ background:gc.bg, color:gc.color, borderColor:gc.border }}
                          title={label}>
                          {g}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="rp-actions">
                <button className="rp-action-btn highlight" onClick={handleDownloadPDF} disabled={downloading}>
                  <PdfIcon /> {downloading ? 'Saving…' : 'Download PDF'}
                </button>
                <button className="rp-action-btn" onClick={handleCopyLink}>
                  {copying ? <CheckIcon /> : <LinkIcon />}
                  {copying ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <div className="rp-footer">
                <p className="rp-footer-made">
                  Made by <a href="https://bputnotes.in" target="_blank" rel="noreferrer">bputnotes.in</a>
                </p>
                <p className="rp-footer-owned">
                  Content owned by <a href="https://www.bput.ac.in/" target="_blank" rel="noreferrer">BPUT Odisha</a>
                </p>
              </div>
            </div>
          )}
        </div>

        <a href="https://bputnotes.in" target="_blank" rel="noreferrer" className="floating-cta">
          Visit bputnotes.in →
        </a>

        {/* Hidden share card */}
        <div id="share-card" style={{ visibility:'hidden', position:'fixed', left:'-9999px', width:400 }}>
          {result && (
            <>
              <div className="sc-header">
                <div className="sc-brand">bputnotes.in · Result Card</div>
                <div className="sc-name">{result.summary.studentName || rollNo}</div>
                <div className="sc-college">{result.summary.collegeName}</div>
              </div>
              <div className="sc-body">
                <div className="sc-sgpa-row">
                  <div>
                    <div className="sc-sgpa-label">SGPA</div>
                    <div className="sc-sgpa-big">{result.sgpa?.sgpa || '—'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginBottom:3 }}>Credits</div>
                    <div style={{ fontWeight:800, fontSize:'1.3rem', color:'#0f172a' }}>{result.sgpa?.cretits || '—'}</div>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:2 }}>Semester {result.summary.semester} · {session}</div>
                  </div>
                </div>
                <div className="sc-meta">
                  <div className="sc-meta-item">
                    <label>Branch</label>
                    <span>{result.summary.branchName?.replace('B.Tech.(','').replace(')','') || '—'}</span>
                  </div>
                  <div className="sc-meta-item">
                    <label>Roll No</label>
                    <span style={{ fontFamily:'monospace' }}>{result.summary.rollNo}</span>
                  </div>
                </div>
                <div>
                  {result.grades.slice(0,7).map((g,i) => {
                    const gc = gradeColor(g.grade)
                    return (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>
                        <span style={{ fontSize:'0.78rem', color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'78%' }}>{g.subjectName}</span>
                        <span style={{ background:gc.bg, color:gc.color, padding:'2px 8px', borderRadius:4, fontWeight:700, fontSize:'0.72rem', flexShrink:0 }}>{g.grade || '—'}</span>
                      </div>
                    )
                  })}
                  {result.grades.length > 7 && (
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:6, textAlign:'center' }}>+{result.grades.length - 7} more subjects</div>
                  )}
                </div>
              </div>
              <div className="sc-footer">
                <div className="sc-watermark">bputnotes.in</div>
                <div className="sc-date">{new Date().toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}