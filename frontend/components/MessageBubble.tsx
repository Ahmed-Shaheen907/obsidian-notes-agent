'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

type Message = { role: 'user' | 'assistant'; content: string; id: string }

function renderWithWikilinks(text: string): React.ReactNode[] {
  const parts = text.split(/(\[\[[^\]]+\]\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[\[(.+)\]\]$/)
    if (match) {
      return <span key={i} className="wikilink">{match[1]}</span>
    }
    return part
  })
}

const markdownComponents: Components = {
  p: ({ children }) => {
    const text = typeof children === 'string' ? children : ''
    if (text.includes('[[')) {
      return <p style={{ margin: '0 0 0.5em' }}>{renderWithWikilinks(text)}</p>
    }
    return <p style={{ margin: '0 0 0.5em' }}>{children}</p>
  },
  li: ({ children }) => <li style={{ marginBottom: '0.15em' }}>{children}</li>,
  code: ({ children, className }) => {
    const isBlock = !!className
    if (isBlock) {
      return <code className={className}>{children}</code>
    }
    return (
      <code style={{
        background: 'var(--color-paper-2)',
        border: '1px solid var(--color-border-dim)',
        borderRadius: 3,
        padding: '1px 5px',
        fontSize: '0.875em',
      }}>
        {children}
      </code>
    )
  },
}

export default function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user'

  return (
    <div
      className="animate-fade-up"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animationDelay: `${Math.min(index * 0.03, 0.12)}s`,
      }}
    >
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--color-amber-light)',
          border: '1px solid var(--color-amber-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0, marginRight: 10, marginTop: 2,
          fontFamily: 'var(--font-display)',
          color: 'var(--color-amber)',
        }}>
          V
        </div>
      )}

      <div style={{
        maxWidth: '72%',
        padding: isUser ? '10px 16px' : '13px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        background: isUser ? 'var(--color-ink)' : 'var(--color-paper-1)',
        color: isUser ? 'var(--color-paper)' : 'var(--color-ink)',
        border: isUser ? 'none' : '1px solid var(--color-border-dim)',
        fontSize: 14,
        lineHeight: 1.65,
        boxShadow: isUser
          ? '0 2px 8px rgba(44,36,22,0.15)'
          : '0 1px 4px rgba(44,36,22,0.06)',
      }}>
        {isUser ? (
          <p style={{ margin: 0 }}>{message.content}</p>
        ) : (
          <div className="prose-paper">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
