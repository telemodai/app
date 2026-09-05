# PRD — tg-moderator-ai

## Product stage

**MVP complete** as of `v1.5.3` (August 2026). Requirements below describe the **shipped** product. Post-MVP items are listed under [Post-MVP](#post-mvp).

## Scope

Web application to manage Telegram moderation bots: connect bot token, configure chats, rules per chat, team access, moderation outcomes, and (in SaaS mode) credits. Runtime moderation runs on incoming Telegram webhooks.

**In scope (MVP):** bot CRUD, per-chat rules and presets, chat binding, webhook lifecycle, team join, dashboard, decision journal, chat user actions (pardon/unban/reset warnings), message templates, release notes page, self-hosted LLM settings, SaaS billing (wallet v2, YooKassa, promo, referral).

**Out of scope (current):** multi-region, non-Telegram channels, organization/workspace layer, email/password auth.

**Billing:** SaaS mode (`DEPLOYMENT_MODE=saas`) — user wallet + per-bot operating balance, YooKassa checkout on `/account/billing`, purchase promo codes, referral rewards to user wallet. Self-hosted default — BYOK, billing no-op. See [billing-design.md](billing-design.md), [billing-economics.md](billing-economics.md).

## User flows

### Login

1. User opens app → redirected to `/login` if no session
2. «Войти через Telegram» → Telegram OIDC → session cookie
3. Post-login redirect preserves `returnTo` (e.g. invite link `/join?code=…` → join modal on `/bots`, referral `/r/:code` → attribution)

### Bot lifecycle

1. Create bot (name + moderation bot token from BotFather)
2. Enable bot → webhook registered at `{BASE_URL}/api/telegram/webhook/{botId}`
3. Bind chats (Telegram chat id or «add to new group» pending flow), configure rules per chat, optional silent mode per rule
4. Optional: customize warn/ban message templates on bot detail page
5. Messages in bound chats → LLM analysis → warn/delete/ban per rule settings
6. Soft-delete bot → chats, rules, team, moderation history preserved; SaaS: remaining bot credits return to owner wallet

### Rules (per chat)

1. Open chat moderation page `/bots/:id/chats/:chatId/moderation`
2. Add presets from catalog or create custom rules (CRUD scoped to the chat)
3. Optional: AI assist to draft rule text
4. Per rule: enable/disable, silent mode, delete on violation, ban after warnings threshold
5. Assign which rules are active for the chat

### Chat users

1. On chat moderation page — list users with warnings/ban state
2. **Pardon** — clear violation context for a user
3. **Unban** / **reset warnings** — operator recovery actions

### Team

1. **Owner** generates access code on bot detail → shares link or code
2. **Manager** logs in via Telegram → joins with code (`POST /api/bots/join` or `/join?code=…`)
3. Owner and manager share operational access (chats, rules, moderation, activate, templates, enable/disable). **Owner only:** delete bot, access codes, remove managers, purchase/allocate credits (SaaS). Manager sees read-only team list and bot credit balance (SaaS). The owner row in `bot_members` cannot be removed

### Dashboard

Aggregated KPIs and activity across all bots the user can access (owner or manager).

### Decision journal

Per-bot list of LLM moderation decisions (`/bots/:id/audit` — UI label **Decision journal** / **Журнал решений**).

### Billing (SaaS only)

1. Owner opens `/account/billing` from header menu
2. Purchase credit packages (YooKassa) or apply promo code → credits land on **user wallet**
3. On bot detail, owner **allocates** wallet credits to bot operating balance
4. Moderation debits bot balance; manager sees balance but cannot purchase or allocate
5. Referral link (`/r/:code`) — bonus to both parties on referee's first purchase

### Release notes

In-app changelog at `/release-notes` (Russian user-facing bullets from `data/releases/`).

## Requirements

| Area | Requirement |
|------|-------------|
| Auth | Telegram OIDC only; session in httpOnly cookie |
| Webhook security | Per-bot `webhook_secret`; header `X-Telegram-Bot-Api-Secret-Token` |
| Rules | Stored per chat (`chat_rules`); presets are catalog in code, copied into DB on add |
| Moderation | OpenAI-compatible LLM; configurable model via env (SaaS) or `/settings/llm` (self-hosted) |
| Deployment | `DEPLOYMENT_MODE` drives billing UI and LLM config surface |
| Data retention | Moderation decisions/messages per retention policy (see `server/core/retention-policy.ts`) |
| Migrations | Incremental Drizzle only; no destructive reset in production |

## Constraints

- `BASE_URL` must be **public HTTPS** for webhooks and OIDC callback
- Dev on `localhost` is insufficient for Telegram login — use **cloudflared** tunnel (`make tunnel`)
- BotFather Web Login redirect URI: `{BASE_URL}/api/auth/telegram/callback`

## Non-goals

- Email/password authentication
- Organization/workspace multi-tenancy layer
- Automatic application of all rule presets on bot creation

## Post-MVP

- Full in-app product documentation (replace `/docs` placeholder)
- Public marketing landing aligned with product positioning
- E2E tests for OIDC flow in CI
- Multi-region deployment

## Open questions

- When to publish real content on `/docs` and `/terms` (placeholders today)
