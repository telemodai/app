# AGENTS.md — tg-moderator-ai (Telemodai)

Repository: [github.com/telemodai/app](https://github.com/telemodai/app). Stable project context. Tasks — GitHub Issues. Implementation behavior — `.cursor/rules/`.

## Project

Self-hosted admin UI + Telegram webhook: AI moderation of chats via configurable rules (LLM). **MVP shipped** (`v1.5.3`) — see [`.docs/project-overview.md`](.docs/project-overview.md) for status and [`.docs/prd.md`](.docs/prd.md) for scope.

**Domain model:**

```
User (telegram_id)
  → Bot (owner_user_id)
      → bot_members (owner | manager)
      → bot_access_codes (invite)
      → chats[]
          → rules[] (per chat)
```

Rules are stored **per chat**; presets are constants in `rule-templates.ts`, added from the catalog on the chat moderation page. Bot access: owner or manager via `bot_members`; manager has operational access (chats, rules, moderation) but cannot delete the bot or manage the team; join via access code.

**SaaS billing (wallet v2):** user `credit_balance` (purchases, signup bonus, referrals) → owner allocates to `bots.credit_balance` for moderation debits. Purchases at `/account/billing`; bot soft-delete reclaims remaining bot credits to owner wallet. See [`.docs/billing-design.md`](.docs/billing-design.md).

Public endpoint without session: `POST /api/telegram/webhook/*` (Telegram). Protection: per-bot `webhook_secret` in the DB + header `X-Telegram-Bot-Api-Secret-Token`.

**Terminology:** user-facing **Decision journal** (RU: **Журнал решений**) — LLM moderation decisions per bot (`/bots/:id/audit`). Code, routes, and i18n keys still use `audit`; do not rename unless explicitly scoped.

More: [`.docs/project-overview.md`](.docs/project-overview.md) · [`.docs/technical-design.md`](.docs/technical-design.md) · [`.docs/i18n.md`](.docs/i18n.md) (admin UI locales) · [`assets/brand/DESIGN.md`](assets/brand/DESIGN.md) (design system + app appendix)

GitHub repo: **`README.md` (EN)** and **`README.ru.md` (RU)** — when editing README, update both.

## Stack

- Bun, Nuxt 4, Nitro, Vue 3, **Tailwind CSS 4** (`@tailwindcss/vite`), **@nuxtjs/i18n** (admin UI: en + ru)
- PostgreSQL, Drizzle
- Telegram OIDC login (`TELEGRAM_LOGIN_BOT_ID`, `TELEGRAM_LOGIN_CLIENT_SECRET`, `BASE_URL`)
- LLM: OpenAI-compatible API via `LLM_API_KEY`, optional `LLM_BASE_URL` (OpenRouter/Polza), `LLM_MODEL`

Code and commits: **English**. User communication: **RU**.

## User communication

Explain as if talking to a **junior developer** who knows the basics but is not steeped in this project’s context.

**How to write:**

- **Plain language** — full sentences; no telegraphic style or dry lists without explanation.
- **Thorough** — do not stop at one line like “take #19”. Explain *what* the task is, *why* it matters, *roughly what to do*, and *pitfalls* if any.
- **Context** — when you mention a file, API, issue, or project term, briefly say what it is and why it matters. Do not assume the user read the issue or remembers the last chat.
- **Structure** — short takeaway first (1–2 sentences), then details. Hard topics in simple words; jargon explained on first use.
- **Practical** — when possible at the end: what follows from this, where to start if they want to continue.

**Avoid:**

- Thin answers like “4 actionable, take #19” with no explanation.
- Cascades of acronyms and file names without context.
- “As last time” without restating what that was.

Keep a light, friendly tone, but **clarity beats brevity**.

## Dev environment

- App: `bun run dev` → port **3001** (`nuxt.config.ts`)
- PostgreSQL on Orange Pi: `pi.home` / `192.168.0.200`, port **54321**, db/user `tgmoderator`
- Dev HTTPS tunnel: `make tunnel` (cloudflared, HTTP/2) → `BASE_URL=https://….trycloudflare.com`
- Client `$fetch` with `method: "POST"` and no body → **HTTP 400** through cloudflared; if there is no payload — use `body: {}`
- Env: `.env.example` → local `.env`

## Cloud Agent VM

- **Tunnel** is not auto-started. If the user asks to open it: `tmux new-session -d -s cloudflared-tunnel -c /workspace -- make tunnel`. To stop: `tmux kill-session -t cloudflared-tunnel` (or `pkill -f 'cloudflared tunnel'`).
- **Admin UI login** (browser only): if you hit `/login` or need the UI, run `bun run cli -- auth refresh-dev-login`, then open the printed `http://localhost:3001/auth/bot-link?token=…` URL in the VM browser.

## Commands

```bash
bun install
bun run dev
bun run build
bun test
bun run db:migrate
bun run cli -- --help          # operator CLI (local, needs DATABASE_URL for subcommands)
```

**Operator CLI (prod):** `docker compose exec app cli …` — bundled `commander` binary in the image (`cli promo create`, etc.). Not the same as `db:migrate` (entrypoint) or `release:notes` (agents).

## DB migrations

**Incremental** Drizzle migrations only (`db:generate` → `db:migrate`). **Forbidden:** `DROP SCHEMA`, truncate, `db:reset`. Policy: [`.docs/database-migrations.md`](.docs/database-migrations.md).

## Logging

Levels and rules: [`.docs/logging.md`](.docs/logging.md). Env `LOG_LEVEL` (`info` default, `debug` for troubleshooting).

## Releases and release notes

Two artifacts — **different audiences, do not mix content**:

| Audience | Where | Content |
|----------|-------|---------|
| **End user** | `data/releases/vX.Y.Z.md` → `/release-notes` in the app | **Russian, plain language** — product changes (bots, rules, moderation, UI). No API, DB tables, migrations, CI, file names, issue numbers |
| **Developers** | `.docs/releases/` (archive + `github-v*.md`), **git tag**, **GitHub Release** | **English** — conventional commits, linked hashes/issues; GitHub file **without frontmatter** |

Files under `data/releases/` — **only when publishing a release** (tag `v*` + commit). Until the first release, the page is empty.

Draft collection: `bun run release:notes vX.Y.Z --write`. User-facing file **rewrite manually**; if nothing concrete for users — neutral copy (see skill). Technical — in repo, GitHub Release, and tag annotation.

Process: [`.agents/skills/release/SKILL.md`](.agents/skills/release/SKILL.md).
