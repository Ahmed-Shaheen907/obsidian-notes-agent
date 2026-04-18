'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push('/auth/login?registered=1')
  }

  const inputStyle = {
    background: 'var(--color-paper)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--color-ink)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
    width: '100%',
  } as React.CSSProperties

  const labelStyle = {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--color-ink-faint)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  } as React.CSSProperties

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-paper)',
      padding: '24px',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 30% 20%, rgba(184,115,51,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 80% 80%, rgba(90,122,90,0.04) 0%, transparent 60%)
        `,
      }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 400,
              color: 'var(--color-ink)',
              letterSpacing: '-0.02em',
            }}>
              Vault
            </span>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-amber)',
              display: 'inline-block',
            }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>
            Create your personal knowledge base
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          style={{
            background: 'var(--color-paper-1)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '32px',
            boxShadow: '0 4px 24px rgba(44, 36, 22, 0.06), 0 1px 0 rgba(255,255,255,0.6) inset',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {error && (
            <div style={{
              background: 'rgba(139,64,73,0.08)',
              border: '1px solid rgba(139,64,73,0.25)',
              borderRadius: 6,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--color-rust)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--color-amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--color-amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password" required value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--color-amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--color-border)' : 'var(--color-amber)',
              color: loading ? 'var(--color-ink-muted)' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '11px',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'background 0.15s',
              marginTop: 2,
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-ink-faint)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link
            href="/auth/login"
            style={{ color: 'var(--color-amber)', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'underline')}
            onMouseLeave={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'none')}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
