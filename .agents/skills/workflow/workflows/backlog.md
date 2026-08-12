# Backlog

Discuss, research the codebase, and file or update tracker issues. **No code changes.**

Combines exploration and planning in one session — typical flow: talk → read code → answer → create issue when asked.

## Entry

**Inputs:** error, problem, idea, question, tradeoff, "how does X work"

**Outputs:**
- Answers in chat (always allowed)
- Issue(s) in the tracker **only when the user explicitly requests** (or clearly confirms filing)

## Modes (same session, any order)

### Discuss & research

- Read [shared/orientation.md](../shared/orientation.md) and relevant source
- Answer: what exists, gaps, options, recommendation
- Separate **current state** vs **proposed change**
- **No** file edits, **no** new issues unless filing mode below

**Strict discuss:** user says "answer only" / "no task" → never create or offer issues.

### File issues

Triggered by explicit request: "create an issue", "add to backlog", "file a task", "update #N", "clarify in the issue".

1. Carry decisions from the conversation into the issue body
2. Propose technical detail (schema, API, UI, prompts) — user steers in chat
3. Follow [shared/tracker-issues.md](../shared/tracker-issues.md) and [issue-template.md](../shared/issue-template.md)
4. On refinement → **edit the same issue**, do not duplicate

**Default:** if the user did not ask for an issue, do not create one — even after a long discussion.

## Principles

- Research code yourself — do not delegate investigation to the user
- Conversation is the spec — approved chat decisions go into the issue
- One issue ≈ one reviewable PR/MR
- User-facing surfaces: prefer human-readable names in issues; internal IDs in storage/API are fine

## After filing

- Return issue URL + short summary (not the full body)
- User may continue to [implementation](implementation.md) on the same or another issue

## Handoff

| Next step | Workflow |
|-----------|----------|
| Build / fix code | [implementation](implementation.md) |
| Long idea session without filing yet | [brainstorm](brainstorm.md) |
| Persist product design | [documentation](documentation.md) |

## Boundaries

- No implementation
- No reorganizing milestones or boards unless the user asks
- Durable product spec belongs in `.docs/`; issues reference it, not replace it
