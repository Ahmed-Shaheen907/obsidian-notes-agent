'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import ChatPanel from './ChatPanel'

type Note = { id: string; title: string; tags: string[]; updated_at: string }
type Message = { role: 'user' | 'assistant'; content: string; id: string }

interface Props {
  initialNotes: Note[]
  tagCounts: Record<string, number>
  userId: string
  userEmail: string
}

export default function ChatShell({ initialNotes, tagCounts, userId, userEmail }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )

  // Realtime subscription — refresh sidebar when notes change
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('vault-notes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
        () => {
          fetch('/api/notes')
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setNotes(data) })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text, id: `u-${Date.now()}` }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token

      if (!jwt) {
        window.location.href = '/auth/login'
        return
      }

      const res = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      })

      if (res.status === 401) {
        window.location.href = '/auth/login'
        return
      }

      const data = await res.json()
      // n8n AI Agent can wrap output differently depending on version
      const responseText =
        data?.output ??
        data?.[0]?.output ??
        data?.response ??
        data?.text ??
        'Sorry, I could not process that request.'

      const assistantMsg: Message = {
        role: 'assistant',
        content: responseText,
        id: `a-${Date.now()}`,
      }
      setMessages(prev => [...prev, assistantMsg])
      fetch('/api/notes').then(r => r.json()).then(data => { if (Array.isArray(data)) setNotes(data) })
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error — please check your network and try again.',
        id: `e-${Date.now()}`,
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, sessionId])

  // Recompute live tag counts from current notes
  const liveTags: Record<string, number> = {}
  for (const note of notes) {
    for (const tag of (note.tags ?? [])) {
      liveTags[tag] = (liveTags[tag] ?? 0) + 1
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--color-paper)',
    }}>
      <Sidebar notes={notes} tagCounts={liveTags} userEmail={userEmail} />
      <ChatPanel messages={messages} loading={loading} onSend={sendMessage} />
    </div>
  )
}
