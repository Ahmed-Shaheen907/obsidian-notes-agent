'use client'

import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import MessageBubble from './MessageBubble'

type Message = { role: 'user' | 'assistant'; content: string; id: string }

interface Props {
  messages: Message[]
  loading: boolean
  onSend: (text: string) => void
}

const STARTERS = [
  'Create a note about my meeting today',
  'What have I written about deadlines?',
  'Find notes tagged #project',
  'What notes link to [[Index]]?',
]

export default function ChatPanel({ messages, loading, onSend }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    onSend(text)
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--color-paper)',
    }}>
      {/* Header */}
      <header style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--color-border-dim)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--color-paper)',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          color: 'var(--color-ink)',
          fontWeight: 400,
        }}>
          Notes Agent
        </span>
        <span style={{
          fontSize: 10,
          color: 'var(--color-ink-faint)',
          padding: '2px 8px',
          borderRadius: 20,
          border: '1px solid var(--color-border-dim)',
          background: 'var(--color-paper-1)',
          letterSpacing: '0.04em',
        }}>
          n8n · Claude · Supabase
        </span>
      </header>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {messages.length === 0 && (
          <div className="animate-fade-in" style={{
            margin: 'auto',
            textAlign: 'center',
            maxWidth: 500,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--color-amber-light)',
              border: '1px solid var(--color-amber-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              color: 'var(--color-amber)',
            }}>
              V
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 400,
              color: 'var(--color-ink)',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}>
              Your Knowledge Vault
            </h1>
            <p style={{
              color: 'var(--color-ink-muted)',
              fontSize: 14,
              margin: '0 0 28px',
              lineHeight: 1.6,
            }}>
              Chat with your notes. Create, search, link ideas with{' '}
              <span className="wikilink">[[wikilinks]]</span>, and export to Obsidian.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}>
              {STARTERS.map(p => (
                <button
                  key={p}
                  onClick={() => onSend(p)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-paper-1)',
                    color: 'var(--color-ink-muted)',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    fontFamily: 'var(--font-body)',
                    transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-amber)'
                    e.currentTarget.style.background = 'var(--color-amber-light)'
                    e.currentTarget.style.color = 'var(--color-ink)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.background = 'var(--color-paper-1)'
                    e.currentTarget.style.color = 'var(--color-ink-muted)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} index={i} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 38 }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`dot-${i + 1}`}
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--color-amber)',
                  opacity: 0.35,
                }}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '14px 24px 20px',
        borderTop: '1px solid var(--color-border-dim)',
        background: 'var(--color-paper)',
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          background: 'var(--color-paper-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          padding: '10px 12px',
          boxShadow: '0 1px 4px rgba(44,36,22,0.05)',
          transition: 'border-color 0.15s',
        }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your notes, or say 'Create a note about…'"
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-ink)',
              fontSize: 14,
              resize: 'none',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.55,
              maxHeight: 160,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={submit}
            disabled={!canSend}
            style={{
              width: 32, height: 32,
              borderRadius: 6,
              border: `1px solid ${canSend ? 'var(--color-amber)' : 'var(--color-border)'}`,
              background: canSend ? 'var(--color-amber)' : 'transparent',
              color: canSend ? '#fff' : 'var(--color-ink-faint)',
              cursor: canSend ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
          >
            ↑
          </button>
        </div>
        <p style={{
          fontSize: 11,
          color: 'var(--color-ink-faint)',
          margin: '6px 0 0',
          textAlign: 'center',
        }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
