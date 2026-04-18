import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

type Note = {
  id: string
  title: string
  body: string
  tags: string[]
  wikilinks: string[]
  created_at: string
  updated_at: string
  user_id: string
}

function toObsidianMarkdown(note: Note): string {
  const tags = (note.tags ?? []).map(t => `  - ${t}`).join('\n')
  const wikilinks = (note.wikilinks ?? []).map(l => `  - "[[${l}]]"`).join('\n')

  return `---
id: ${note.id}
title: "${note.title.replace(/"/g, '\\"')}"
tags:
${tags || '  []'}
created: ${note.created_at}
updated: ${note.updated_at}
${wikilinks ? `wikilinks:\n${wikilinks}` : ''}
---

${note.body ?? ''}`
}

function sanitizeFilename(title: string): string {
  return title.replace(/[/\\?%*:|"<>]/g, '-').trim().slice(0, 100) + '.md'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, body, tags, wikilinks, created_at, updated_at, user_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const zip = new JSZip()
  const usedNames = new Map<string, number>()

  for (const note of notes ?? []) {
    const content = toObsidianMarkdown(note)
    let filename = sanitizeFilename(note.title)

    // Deduplicate filenames
    if (usedNames.has(filename)) {
      const count = usedNames.get(filename)! + 1
      usedNames.set(filename, count)
      filename = filename.replace('.md', ` (${count}).md`)
    } else {
      usedNames.set(filename, 1)
    }

    zip.file(filename, content)
  }

  const noteCount = (notes ?? []).length
  zip.file('_README.md', `# Vault Export\n\nExported on ${new Date().toISOString()}\nTotal notes: ${noteCount}\n\nOpen this folder as a vault in Obsidian to view your notes.\n`)

  const buffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="vault-export-${date}.zip"`,
    },
  })
}
