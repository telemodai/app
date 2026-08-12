# Documentation

Maintain durable project documentation. No code changes, no issue filing.

## Entry

- User asks to update docs, README, `.docs/`, or `AGENTS.md`
- After brainstorm: capture approved design in persistent docs

## Document set

| File | Purpose | Audience |
|------|---------|------------|
| `AGENTS.md` (repo root) | Short agent orientation — see below | AI agents (always in context) |
| `.docs/project-overview.md` | Product vision, status | Agents & team |
| `.docs/prd.md` | Scope, flows, requirements | Agents & team |
| `.docs/technical-design.md` | Stack, architecture, engineering rules | Agents & team |
| `README.md` | Quickstart, install, usage | Humans visiting the repo |

**README vs overview:** README = how to run the project. Overview = what/why/status. Do not collapse them.

## AGENTS.md

Open format for coding agents ([agents.md](https://agents.md)). Often loaded **automatically every session** — keep it **short** (aim for ~100–150 lines max).

### What belongs in AGENTS.md

- **What the project is** — 2–4 sentences
- **Stack & key commands** — build, test, dev server (non-obvious flags only)
- **Conventions agents cannot infer** — package manager, language for commits vs chat, test runner
- **Stable boundaries** — security rules, paths not to touch, env file handling
- **Pointers** — links to `.docs/`, workflow rules, deeper guides (`docs/logging.md`, etc.)

Think: *README for agents* — orientation and constraints, not encyclopedia.

### What does NOT belong

- Task-specific instructions ("for issue #58 do X")
- Sprint/backlog state
- Long tutorials duplicating `.docs/` or README
- Copy-paste of PRD or full architecture (link instead)
- Tooling prose that belongs in README for humans

### Monorepos

Optional nested `AGENTS.md` per package — nearest file wins for edits in that tree.

### Maintenance

- Update when stack, commands, or team-wide rules change
- Commit like source code; review in PR/MR
- Prefer editing AGENTS.md + pointer over growing it whenever detail is added

## When to update which file

| Change | Update |
|--------|--------|
| Vision, audience, status | `project-overview.md` |
| Scope, requirements, flows | `prd.md` |
| Stack, architecture, rules | `technical-design.md` |
| Install, config, usage | `README.md` |
| Agent-facing commands & stable rules | `AGENTS.md` |

## Process

1. Read [shared/orientation.md](../shared/orientation.md).
2. Identify gaps — placeholders, conflicts, outdated setup steps.
3. Edit in place — no parallel draft files.
4. Remove contradictions across files.

If the user says "update docs" without specifying files: report gaps, offer to fill wizard-style (one question at a time).

## Scaffolding

If `.docs/` is missing, create minimal section headers:

**project-overview.md:** What · For whom · Problem · Value · Status

**prd.md:** Scope · User flows · Requirements · Constraints · Non-goals · Open questions

**technical-design.md:** Stack · Key decisions · Core entities · Project structure · Engineering rules

## Boundaries

- No issues or milestones — use [backlog](backlog.md)
- No implementation — use [implementation](implementation.md)
