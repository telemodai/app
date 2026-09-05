# Project overview — Telemodai (tg-moderator-ai)

Repository: [github.com/telemodai/app](https://github.com/telemodai/app)

## What

Self-hosted web admin + Telegram webhook service for **AI chat moderation**. Operators connect moderation bots, define rules (custom or presets), attach rule sets per chat, and review logs and the decision journal (LLM moderation decisions).

Default product name in UI: **Telemodai** (`APP_NAME` env).

## For whom

- Community or business chat admins who want configurable LLM moderation without building their own stack
- Self-hosters who need control over data, models, and deployment

## Problem

Manual moderation does not scale; generic bot filters miss context. Teams need per-chat policies, explainable actions, and a simple admin UI.

## Value

- **Per-bot rule library** with presets (ads, politics, aggression, scams, etc.)
- **Per-chat rule subsets** — same bot, different chats, different policies
- **Actions:** warn / delete / ban per rule; silent mode runs moderation without posting to the chat
- **Team access:** owner + managers via access codes; Telegram login (no separate passwords)
- **Observability:** dashboard, bot statistics, decision journal
- **Chat operators:** per-chat user list — pardon, unban, reset warnings
- **Message templates:** customizable warn/ban Telegram HTML per bot
- **AI rule assist:** draft rule text from a prompt on the chat moderation page
- **SaaS billing (optional):** user wallet, YooKassa checkout, allocate credits to bots; promo codes and referral rewards — [billing-design.md](billing-design.md)
- **i18n:** English default admin UI + Russian; browser locale detection; footer language switcher

## Domain model

```
User (telegram_id)
  → Bot (owner_user_id)
      → bot_members (owner | manager)
      → bot_access_codes (invite)
      → chats[] → rules[] (per chat) → moderation
```

## Status

**MVP shipped** (`v1.5.3`, August 2026) — the end-to-end moderation product is in production. Further work is mostly polish, landing, and in-app documentation rather than new core subsystems.

| Area | State |
|------|-------|
| Core loop | Telegram login → bot → chat binding → per-chat rules → LLM moderation → warn/delete/ban + decision journal |
| Self-hosted | `DEPLOYMENT_MODE=self-hosted` (default) — BYOK LLM via env or `/settings/llm` |
| SaaS | `DEPLOYMENT_MODE=saas` — user wallet, YooKassa checkout, per-bot credit allocation, promo + referral — [billing-design.md](billing-design.md) |
| Architecture | Bot-centric (post–#72 refactor); no workspaces / Better Auth |
| Auth | Telegram OIDC (`TELEGRAM_LOGIN_*` + `BASE_URL`) |
| Rules | Code presets in `server/database/rule-templates.ts`; per-chat copies in DB |
| Production | Docker image `ghcr.io/telemodai/app` on GHCR; PostgreSQL and Traefik external to the app container |
| Admin UI | en + ru; dark/light theme |

### Post-MVP / polish

- In-app product documentation (`/docs` — placeholder copy today)
- Public marketing landing (separate from the admin app)
- E2E coverage for OIDC in CI
- Minor UI and copy iterations

### Legacy

Pre–#72 workspace model: [archive/SPEC-legacy.md](archive/SPEC-legacy.md). User release note `data/releases/v1.0.0.md` carries an archive banner for the old product shape.

## Related docs

| Document | Purpose |
|----------|---------|
| [prd.md](prd.md) | Scope, flows, requirements |
| [technical-design.md](technical-design.md) | Stack, API, engineering rules |
| [billing-design.md](billing-design.md) | SaaS credits, deployment mode, YooKassa |
| [billing-economics.md](billing-economics.md) | RUB tiers, bundle lifetime tables, COGS |
| [i18n.md](i18n.md) | Admin UI locales, keys, conventions |
| [deploy.md](deploy.md) | Production deployment |
| [database-migrations.md](database-migrations.md) | Drizzle migration policy |
| [archive/SPEC-legacy.md](archive/SPEC-legacy.md) | **Archived** early spec (MongoDB era) |
