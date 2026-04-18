'use client'

import { useState } from 'react'

export default function ExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/export-vault')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vault-export-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid var(--color-border)',
        background: 'var(--color-paper-1)',
        color: 'var(--color-ink-muted)',
        fontSize: 12,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontFamily: 'var(--font-body)',
        transition: 'border-color 0.15s, color 0.15s',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={e => {
        if (!loading) {
          (e.currentTarget).style.borderColor = 'var(--color-amber)'
          ;(e.currentTarget).style.color = 'var(--color-amber)'
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget).style.borderColor = 'var(--color-border)'
        ;(e.currentTarget).style.color = 'var(--color-ink-muted)'
      }}
    >
      <span style={{ fontSize: 14 }}>↓</span>
      {loading ? 'Exporting…' : 'Export Vault (.zip)'}
    </button>
  )
}
