"""
Evaluation Harness — Obsidian Notes Agent
==========================================
Runs 10 conversational scenarios against the live n8n+Supabase agent.

Each scenario has:
  name   — human-readable label
  turns  — list of user messages (multi-element = multi-turn)
  validate(last_response, admin, user_id) → bool

Credentials: create apps/obsidian-notes-agent/.env.eval with:
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  SUPABASE_ANON_KEY=your_anon_key
  N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/obsidian-notes-agent
  EVAL_EMAIL=your_app_login_email
  EVAL_PASSWORD=your_app_login_password

Run: python eval.py
"""

import os, sys, time, json, re
from pathlib import Path
import httpx
from supabase import create_client, Client

# ── Load .env.eval (before reading env vars) ──────────────────────────────────

env_file = Path(__file__).parent / ".env.eval"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_URL  = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
WEBHOOK_URL   = os.environ.get("N8N_WEBHOOK_URL", "")
DELAY_BETWEEN = 3   # seconds between scenarios (rate limit buffer)
EVAL_PREFIX   = "[EVAL]"  # all test note titles start with this

if not all([SUPABASE_URL, SUPABASE_KEY, SUPABASE_ANON_KEY, WEBHOOK_URL]):
    print("Error: set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, N8N_WEBHOOK_URL in .env.eval")
    sys.exit(1)

EMAIL    = os.environ.get("EVAL_EMAIL", "")
PASSWORD = os.environ.get("EVAL_PASSWORD", "")

if not EMAIL or not PASSWORD:
    print("Error: set EVAL_EMAIL and EVAL_PASSWORD in apps/obsidian-notes-agent/.env.eval")
    sys.exit(1)

# ── Auth ──────────────────────────────────────────────────────────────────────

admin: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Signing in...", end=" ", flush=True)
auth_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
res = auth_client.auth.sign_in_with_password({"email": EMAIL, "password": PASSWORD})
JWT     = res.session.access_token
USER_ID = res.user.id
SESSION = f"eval-{int(time.time())}-{os.urandom(3).hex()}"
print(f"ok (user={USER_ID[:8]}…  session={SESSION})")

# ── Helpers ───────────────────────────────────────────────────────────────────

def send(message: str) -> str:
    """Send one turn to the n8n webhook, return agent response text."""
    r = httpx.post(
        WEBHOOK_URL,
        json={"message": message, "session_id": SESSION},
        headers={"Authorization": f"Bearer {JWT}", "Content-Type": "application/json"},
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    return (
        data.get("output")
        or (data[0].get("output") if isinstance(data, list) else None)
        or data.get("response")
        or data.get("text")
        or ""
    )

def db_notes(title_ilike: str | None = None, tag: str | None = None) -> list[dict]:
    """Query notes via admin client."""
    q = admin.table("notes").select("id,title,body,tags").eq("user_id", USER_ID)
    if title_ilike:
        q = q.ilike("title", f"%{title_ilike}%")
    if tag:
        q = q.contains("tags", [tag])
    return q.execute().data or []

def no_results_phrase(text: str) -> bool:
    r = text.lower().replace("\u2018", "'").replace("\u2019", "'")
    return any(p in r for p in [
        "no notes", "no note", "found 0", "0 note", "found no",
        "couldn't find", "couldn't locate", "don't have", "nothing",
        "no match", "didn't find", "did not find", "unable to find",
        "unable to locate", "not able to", "wasn't able to",
        "was not able to", "no results", "not found", "aren't any",
        "there are no", "cannot locate", "can't locate", "can't find",
        "cannot find",
    ])

# ── Scenarios ─────────────────────────────────────────────────────────────────

scenarios = [

    # 1. Add note
    {
        "name": "Add note",
        "turns": [f"Save a note titled '{EVAL_PREFIX} Sprint plan' — finish auth module by Friday. Tag it work."],
        "validate": lambda res, *_: bool(db_notes("Sprint plan")),
    },

    # 2. Search by keyword
    {
        "name": "Search by keyword",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} API limits' — rate limit is 500 requests per minute. Tag it tech.",
            "Find my notes about rate limit.",
        ],
        "validate": lambda res, *_: any(w in res.lower() for w in ["rate", "500", "api", "limit"]),
    },

    # 3. Search by tag
    {
        "name": "Search by tag",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} Deploy checklist' — run migrations first. Tag it ops.",
            "Show me my notes tagged ops.",
        ],
        "validate": lambda res, *_: any(w in res.lower() for w in ["deploy", "migration", "ops", "checklist"]),
    },

    # 4. Get note body via get_note
    {
        "name": "Get note body",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} Udemy plan' — watch at least 2 hours of the Python course today.",
            f"What does my {EVAL_PREFIX} Udemy plan note say?",
        ],
        "validate": lambda res, *_: any(w in res.lower() for w in ["python", "udemy", "2 hour", "watch"]),
    },

    # 5. Update note
    {
        "name": "Update note",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} Budget' — estimated cost is 10000.",
            f"Update the {EVAL_PREFIX} Budget note — actual cost came in at 8500.",
        ],
        "validate": lambda res, *_: any(
            "8500" in n["body"] or "8,500" in n["body"]
            for n in db_notes("Budget")
        ),
    },

    # 6. Delete with confirmation
    {
        "name": "Delete with confirmation",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} Old contract' — no longer active.",
            f"Delete the {EVAL_PREFIX} Old contract note.",
            "yes",
        ],
        "validate": lambda res, *_: not db_notes("Old contract"),
    },

    # 7. No results — graceful
    {
        "name": "No results graceful",
        "turns": ["Find notes about quantum computing and dark matter"],
        "validate": lambda res, *_: no_results_phrase(res),
    },

    # 8. Answer question over notes
    {
        "name": "Answer question over notes",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} Q3 goal A' — increase revenue by 20%. Tag it strategy.",
            f"Save a note titled '{EVAL_PREFIX} Q3 goal B' — reduce churn by 15%. Tag it strategy.",
            "Summarise my strategy notes.",
        ],
        "validate": lambda res, *_: (
            ("revenue" in res.lower() or "20" in res) and
            ("churn" in res.lower() or "15" in res)
        ),
    },

    # 9. Get backlinks
    {
        "name": "Get backlinks",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} Architecture overview' — see [[{EVAL_PREFIX} Auth module]] for details.",
            f"What notes link to {EVAL_PREFIX} Auth module?",
        ],
        "validate": lambda res, *_: "architecture" in res.lower() or "overview" in res.lower(),
    },

    # 10. Multi-turn: add → search → read body
    {
        "name": "Multi-turn: add, find, read",
        "turns": [
            f"Save a note titled '{EVAL_PREFIX} Travel plans' — fly to Lisbon on May 10, hotel booked.",
            f"Find my {EVAL_PREFIX} Travel plans note.",
            "What does it say?",
        ],
        "validate": lambda res, *_: any(w in res.lower() for w in ["lisbon", "may", "hotel", "fly"]),
    },
]

# ── Runner ────────────────────────────────────────────────────────────────────

def run_scenario(scenario: dict) -> tuple[bool, str]:
    last = ""
    # Use a unique sub-session per scenario so memory doesn't bleed
    global SESSION
    orig_session = SESSION
    SESSION = f"{orig_session}-s{scenarios.index(scenario)+1}"
    try:
        for turn in scenario["turns"]:
            last = send(turn)
            time.sleep(1)  # small pause between turns in same scenario
        passed = scenario["validate"](last, admin, USER_ID)
        return bool(passed), last
    except Exception as e:
        return False, f"Exception: {e}"
    finally:
        SESSION = orig_session

def run_eval():
    print()
    print("=" * 60)
    print("  Obsidian Notes Agent — Evaluation Harness")
    print(f"  Session: {SESSION}")
    print("=" * 60)
    print()

    passed_count = 0
    failed_count = 0

    for i, scenario in enumerate(scenarios):
        if i > 0:
            time.sleep(DELAY_BETWEEN)

        label = f"[{i+1}/{len(scenarios)}] {scenario['name']}"
        print(f"{label} ... ", end="", flush=True)

        ok, response = run_scenario(scenario)
        if ok:
            print("✓ PASS")
            passed_count += 1
        else:
            print("✗ FAIL")
            snippet = response[:120].replace("\n", " ")
            print(f'   └─ Agent said: "{snippet}"')
            failed_count += 1

    # Cleanup all [EVAL] notes for this user
    print()
    print("Cleaning up test notes...", end=" ", flush=True)
    rows = db_notes(EVAL_PREFIX)
    for row in rows:
        admin.table("notes").delete().eq("id", row["id"]).execute()
    print(f"deleted {len(rows)} note(s)")

    print()
    print("=" * 60)
    print(f"  Results: {passed_count}/{len(scenarios)} passed")
    print(f"  Pass rate: {round(passed_count/len(scenarios)*100)}%")
    print("=" * 60)

    sys.exit(0 if failed_count == 0 else 1)

run_eval()
