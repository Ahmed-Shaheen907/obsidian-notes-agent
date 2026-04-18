'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    window.location.href = '/chat'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-paper)',
      padding: '24px',
    }}>
      {/* Subtle grain texture via radial gradients */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 30% 20%, rgba(184,115,51,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 80% 80%, rgba(90,122,90,0.04) 0%, transparent 60%)
        `,
      }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {/* Logo / wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8,
          }}>
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
            Sign in to your knowledge base
          </p>
        </div>

        <form
          onSubmit={handleLogin}
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
            <label style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-ink-faint)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 14,
                color: 'var(--color-ink)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-ink-faint)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 14,
                color: 'var(--color-ink)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.15s',
              }}
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-ink-faint)', marginTop: 20 }}>
          No account?{' '}
          <Link
            href="/auth/register"
            style={{ color: 'var(--color-amber)', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'underline')}
            onMouseLeave={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'none')}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
