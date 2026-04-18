import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ChatShell from '@/components/ChatShell'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: notes } = await admin
    .from('notes')
    .select('id, title, tags, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  const tagCounts: Record<string, number> = {}
  for (const note of notes ?? []) {
    for (const tag of (note.tags ?? [])) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  return (
    <ChatShell
      initialNotes={notes ?? []}
      tagCounts={tagCounts}
      userId={user.id}
      userEmail={user.email ?? ''}
    />
  )
}
