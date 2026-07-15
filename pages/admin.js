import { useState, useEffect } from 'react'
import Head from 'next/head'

function AdminLogin({ onLoggedIn }) {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e && e.preventDefault()
    if (!secret) { setError('Please enter the admin secret.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSecret: secret }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed.'); setLoading(false); return }
      onLoggedIn()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="page-bg">
      <div className="card fade-up" style={{ maxWidth: 440 }}>
        <div className="card-body">
          <div className="tag bulk-tag">Admin</div>
          <h1 className="headline">Manage<br /><em>CR / Faculty Access</em></h1>
          <p className="subtext">Enter the admin secret to manage bulk-checker accounts.</p>

          <div className="field">
            <label>Admin Secret</label>
            <input
              type="password"
              placeholder="••••••••"
              value={secret}
              onChange={e => { setSecret(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="off"
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" />Checking…</> : 'Unlock →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState(null) // null = loading
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('CR')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState('') // username currently being removed

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.status === 401) { onLogout(); return }
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      setUsers([])
    }
  }

  useEffect(() => { loadUsers() }, [])

  const handleCreate = async (e) => {
    e && e.preventDefault()
    setError(''); setSuccess('')
    if (!username.trim() || !password) { setError('Username and password are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not create account.'); setCreating(false); return }
      setSuccess(`Account "${data.user.username}" created.`)
      setUsername(''); setPassword('')
      await loadUsers()
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setCreating(false)
  }

  const handleRemove = async (uname) => {
    if (!confirm(`Remove access for "${uname}"? This can't be undone — you'd need to recreate the account to restore it.`)) return
    setRemoving(uname)
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname }),
      })
      await loadUsers()
    } catch {
      alert('Could not remove account. Please try again.')
    }
    setRemoving('')
  }

  const handleLogoutClick = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    onLogout()
  }

  return (
    <div className="page-bg">
      <div style={{ maxWidth: 560, width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button className="back-btn" onClick={handleLogoutClick}>Log out →</button>
      </div>

      {/* Add account */}
      <div className="card" style={{ maxWidth: 560, width: '100%' }}>
        <div className="card-body">
          <div className="tag bulk-tag">Admin</div>
          <h1 className="headline">Add a<br /><em>CR / Faculty account</em></h1>
          <p className="subtext">
            Only create an account after verifying the person over WhatsApp.
            Share the username/password with them directly afterward.
          </p>

          <div className="field">
            <label>Username</label>
            <input
              type="text" placeholder="e.g. cr_cse_a_2022"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); setSuccess('') }}
              autoComplete="off" spellCheck={false}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="text" placeholder="give them a strong password (min 6 chars)"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); setSuccess('') }}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label>Role</label>
            <div className="select-wrap">
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="CR">CR</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert" style={{ background: '#dcfce7', color: '#16a34a' }}>{success}</div>}

          <button className="btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? <><span className="spinner" />Creating…</> : 'Create Account →'}
          </button>
        </div>
      </div>

      {/* Existing accounts */}
      <div className="card" style={{ maxWidth: 560, width: '100%', marginTop: 16 }}>
        <div className="card-body" style={{ padding: '20px 20px 24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            Existing accounts {users ? `(${users.length})` : ''}
          </h2>

          {users === null && <p className="subtext">Loading…</p>}
          {users && users.length === 0 && <p className="subtext">No accounts yet — create the first one above.</p>}

          {users && users.length > 0 && (
            <table className="bulk-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.username}>
                    <td>{u.username}</td>
                    <td>
                      <span className="sgpa-pill" style={{
                        background: u.role === 'faculty' ? '#dbeafe' : '#f3e8ff',
                        color: u.role === 'faculty' ? '#2563eb' : '#7c3aed',
                        border: 'none',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="dim">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <button
                        className="btn-stop"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => handleRemove(u.username)}
                        disabled={removing === u.username}
                      >
                        {removing === u.username ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  const checkSession = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/admin/users')
      setLoggedIn(res.status !== 401)
    } catch {
      setLoggedIn(false)
    }
    setChecking(false)
  }

  useEffect(() => { checkSession() }, [])

  return (
    <>
      <Head>
        <title>Admin — BPUT Result</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {checking ? (
        <div className="page-bg" />
      ) : loggedIn ? (
        <AdminDashboard onLogout={() => setLoggedIn(false)} />
      ) : (
        <AdminLogin onLoggedIn={() => setLoggedIn(true)} />
      )}
    </>
  )
}
