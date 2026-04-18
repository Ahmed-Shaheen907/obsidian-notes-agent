# Vault — AI Notes Agent

A conversational notes app powered by an n8n AI Agent, Supabase, and a Next.js frontend. Talk to your notes in plain English — create, search, update, delete, and ask questions across your entire vault.

**Live demo:** https://frontend-sepia-xi-79.vercel.app

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, Supabase Auth, Supabase Realtime |
| Agent | n8n AI Agent (gpt-4o-mini) with 8 toolCode nodes |
| Database | Supabase (Postgres + pgvector + FTS) |
| Deploy | Vercel |

---

## What the agent can do

- **Add** notes with title, body, and tags
- **Search** by keyword, tag, or date range
- **Get** a specific note by name and read its full content
- **Update** title, body, or tags
- **Delete** with a confirmation step (asks "YES" before deleting)
- **Answer questions** across all your notes
- **Find backlinks** — which notes link to a given note

---

## Running the frontend locally

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://dznxlkwphwptnmfhjthg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<your supabase service role key>
NEXT_PUBLIC_N8N_WEBHOOK_URL=<your n8n webhook url>
```

```bash
npm run dev
# → http://localhost:3000
```

---

## Running the eval harness

The eval harness tests the full stack end-to-end: it signs in as a real user, sends 10 conversational scenarios to the live n8n webhook, and verifies the agent's responses and the resulting database state.

### Prerequisites

```bash
pip install httpx supabase
```

### Step 1 — Create your credentials file

In the `obsidian-notes-agent/` directory (this folder), create a file called `.env.eval`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/obsidian-notes-agent
EVAL_EMAIL=your_app_login_email@example.com
EVAL_PASSWORD=your_app_login_password
```

Use the same email and password you use to log into the Vault app. The eval signs in as you to get a valid JWT, runs the tests, then **automatically deletes all test notes** it created (they are prefixed with `[EVAL]`).

### Step 2 — Run

```bash
cd apps/obsidian-notes-agent   # this directory
python eval.py
```

### Step 3 — Read the output

```
============================================================
  Obsidian Notes Agent — Evaluation Harness
  Session: eval-1713500000-abc123
============================================================

[1/10] Add note ... ✓ PASS
[2/10] Search by keyword ... ✓ PASS
[3/10] Search by tag ... ✓ PASS
[4/10] Get note body ... ✓ PASS
[5/10] Update note ... ✓ PASS
[6/10] Delete with confirmation ... ✓ PASS
[7/10] No results graceful ... ✓ PASS
[8/10] Answer question over notes ... ✓ PASS
[9/10] Get backlinks ... ✓ PASS
[10/10] Multi-turn: add, find, read ... ✓ PASS

Cleaning up test notes... deleted 0 note(s)

============================================================
  Results: 10/10 passed
  Pass rate: 100%
============================================================
```

Exit code `0` = all passed. Exit code `1` = one or more failures.

### What each scenario tests

| # | Scenario | Tool(s) exercised |
|---|---|---|
| 1 | Add a note with a tag | `add_note` |
| 2 | Search for a note by keyword | `search_notes` |
| 3 | Search for notes by tag | `search_notes` |
| 4 | Ask what a specific note says | `get_note` |
| 5 | Update a note's content | `update_note` |
| 6 | Delete a note (two-step: request + "yes") | `delete_note` |
| 7 | Ask about a topic with no matching notes | `search_notes` (graceful) |
| 8 | Summarise all notes on a topic | `answer_question` |
| 9 | Find notes that link to another note | `get_backlinks` |
| 10 | Multi-turn: add a note, find it, read it | `add_note` + `search_notes` + `get_note` |

---

## Notes

- The agent uses **gpt-4o-mini** via the n8n "AI Team" OpenAI credential.
- JWT auth: the frontend obtains a Supabase session token and sends it as `Authorization: Bearer <token>` on every webhook call. The n8n workflow validates it before processing.
- All Supabase queries in n8n use a **service role key** hardcoded as constants (n8n Cloud plan does not support env vars in toolCode nodes).
