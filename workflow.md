# Obsidian Notes Agent — n8n Workflow

## Workflow Name: `obsidian-notes-agent-chat`

## Trigger

- **Type:** Webhook (POST, synchronous — frontend awaits response directly)
- **Path:** `obsidian-notes-agent`
- **Production URL:** `https://ahmedshaheen19.app.n8n.cloud/webhook/obsidian-notes-agent`
- **Test URL:** `https://ahmedshaheen19.app.n8n.cloud/webhook-test/obsidian-notes-agent`
- **Content-Type:** `application/json`
- **Auth:** Supabase JWT in `Authorization: Bearer <token>` header (verified in Code node)

## Request Body

| Field | Type | Description |
|---|---|---|
| `message` | string | The user's chat message |
| `session_id` | string | Browser session identifier for memory persistence |

## Response Body

```json
{ "output": "The AI agent's natural language response" }
```

## Node Pipeline

```
[Webhook]
  → [Code: Verify JWT]       — HS256 HMAC verify using SUPABASE_JWT_SECRET, extracts user_id
  → [AI Agent]               — Claude claude-sonnet-4-6, Postgres memory, 7 tools
  → [Respond to Webhook]     — returns AI Agent output
```

## AI Agent Configuration

- **LLM:** Anthropic claude-sonnet-4-6 (credential: Anthropic API key)
- **Memory:** Postgres Chat Memory
  - Table: `chat_memory`
  - Session ID key: `={{ $json.session_id }}`
  - Context window: 20 messages
- **Prompt input:** `={{ $json.message }}`

## Tools (7 Code Nodes)

| Tool | Description | Key Supabase operation |
|---|---|---|
| `add_note` | Create a new note. Extracts `[[wikilinks]]` from body automatically. | `POST /rest/v1/notes` |
| `search_notes` | Full-text search + tag filter + date range. | `GET` with `fts=wfts.{query}`, `tags=cs.{tag}` |
| `update_note` | Update title/body/tags. Re-extracts wikilinks if body changes. | `PATCH /rest/v1/notes?id=eq.{id}` |
| `delete_note` | Two-step: `confirmed=false` shows note title for confirmation; `confirmed=true` deletes. | `GET` then `DELETE` |
| `answer_question` | Fetch ALL notes (up to 100) and reason over them as context. | `GET /rest/v1/notes` all |
| `semantic_search_notes` | pgvector cosine similarity via `match_notes` RPC. Falls back to FTS. | `POST /rest/v1/rpc/match_notes` |
| `get_backlinks` | Find notes that contain `[[note_title]]` in their wikilinks array. | `GET` with `wikilinks=cs.{title}` |

## n8n Environment Variables Required

Set in n8n Cloud > Settings > Variables:

| Variable | Source |
|---|---|
| `SUPABASE_URL` | Supabase Project Settings > API > Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings > API > service_role key |
| `SUPABASE_JWT_SECRET` | Supabase Project Settings > API > JWT Secret |
| `OPENAI_API_KEY` | root `.env` — optional, enables semantic search embeddings |

## n8n Credentials Required

- **Anthropic** — API key credential (used by AI Agent LLM node)
- **Postgres** — connection to Supabase DB (used by Postgres Chat Memory node)
  - Host: `db.<project-ref>.supabase.co`
  - Port: `5432`
  - Database: `postgres`
  - User: `postgres`
  - Password: from Supabase Project Settings > Database > Password

## Frontend Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://ahmedshaheen19.app.n8n.cloud/webhook/obsidian-notes-agent
```

## Vercel Environment Variables

Same as .env.local (set in Vercel project Settings > Environment Variables).
`NEXT_PUBLIC_N8N_WEBHOOK_URL` must point to the **production** webhook URL (not `-test-`).

## Test Curl

```bash
# 1. Get a Supabase access token:
curl -X POST "https://<project-ref>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'
# Copy access_token from response

# 2. Call the agent:
curl -X POST https://ahmedshaheen19.app.n8n.cloud/webhook/obsidian-notes-agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"message":"Create a note titled My First Note with body This is a test [[Wikilink]]","session_id":"test-1"}'
```

## Supabase Schema Summary

```sql
-- notes table (YAML-frontmatter Obsidian format stored as structured columns)
notes (id, title, body, tags[], wikilinks[], created_at, updated_at, user_id, fts tsvector, embedding vector(1536))

-- chat_memory table (n8n Postgres Chat Memory)
chat_memory (id, session_id, message jsonb, created_at)

-- match_notes RPC (pgvector semantic search)
match_notes(query_embedding, match_user_id, match_count, match_threshold) → table
```
