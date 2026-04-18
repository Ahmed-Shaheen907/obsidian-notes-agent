'use client'

import ExportButton from './ExportButton'
import { createClient } from '@/lib/supabase/client'

type Note = { id: string; title: string; tags: string[]; updated_at: string }

interface Props {
  notes: Note[]
  tagCounts: Record<string, number>
  userEmail: string
}

export default function Sidebar({ notes, tagCounts, userEmail }: Props) {
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)

  const recentNotes = notes.slice(0, 10)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside style={{
      borderRight: '1px solid var(--color-border)',
      background: 'var(--color-paper-1)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      gap: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 24 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 400,
          color: 'var(--color-ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          Vault
        </span>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--color-amber)',
          display: 'inline-block',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: 1 }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tags */}
      {topTags.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--color-ink-faint)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: '0 0 10px',
          }}>
            Tags
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {topTags.map(([tag, count]) => (
              <span key={tag} style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
                background: 'var(--color-sage-light)',
                border: '1px solid rgba(90,122,90,0.2)',
                color: 'var(--color-sage)',
                whiteSpace: 'nowrap',
              }}>
                #{tag}
                <span style={{ color: 'var(--color-ink-faint)', marginLeft: 3, opacity: 0.7 }}>{count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--color-ink-faint)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: '0 0 10px',
          }}>
            Recent
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentNotes.map(note => (
              <li key={note.id}>
                <div style={{
                  fontSize: 12,
                  color: 'var(--color-ink-muted)',
                  padding: '5px 8px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'default',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-paper-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: 'var(--color-ink-faint)', marginRight: 5, fontSize: 10 }}>◆</span>
                  {note.title}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--color-border-dim)', marginBottom: 12 }} />

      {/* Export + user info + sign out */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ExportButton />

        <div style={{
          fontSize: 11,
          color: 'var(--color-ink-faint)',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '2px 4px',
        }}>
          {userEmail}
        </div>

        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-ink-faint)',
            fontSize: 12,
            cursor: 'pointer',
            padding: '4px',
            fontFamily: 'var(--font-body)',
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-rust)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
