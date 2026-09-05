# Technical design — tg-moderator-ai

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| App | Nuxt 4, Nitro, Vue 3, Tailwind CSS 4 (`@tailwindcss/vite`), **@nuxtjs/i18n** (en + ru admin UI) |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Custom Telegram OIDC (PKCE + `jose` JWT verify) — **not** Better Auth |
| LLM | OpenAI-compatible client (`LLM_API_KEY`, optional `LLM_BASE_URL`, `LLM_MODEL`) |
| Logging | Pino (`LOG_LEVEL`) — see [logging.md](logging.md) |

## Key decisions

1. **Bot-centric domain** — no workspace/org tables; access via `bot_members`
2. **Telegram OIDC** — login bot separate from moderation bots (`TELEGRAM_LOGIN_*`)
3. **Rule presets in code** — `RULE_TEMPLATES` catalog; DB stores per-**chat** rule rows (`rules.chat_id`) with UUID `rule.id`
4. **Webhook per bot** — `POST /api/telegram/webhook/:botId` + secret token header
5. **Deployment modes** — `DEPLOYMENT_MODE=self-hosted` (BYOK, billing no-op) vs `saas` (platform LLM env, wallet + credits) — see [billing-design.md](billing-design.md)
6. **Incremental migrations only** — see [database-migrations.md](database-migrations.md)
7. **Admin UI i18n** — `@nuxtjs/i18n`, `no_prefix`, lazy `i18n/locales/`; browser locale + footer switcher; see [i18n.md](i18n.md)

## Core entities (PostgreSQL)

| Table / concept | Purpose |
|-----------------|---------|
| `users` | `telegram_id`, profile from OIDC; `credit_balance` (SaaS wallet) |
| `sessions` | Session token for cookie auth |
| `bots` | Moderation bot config + token; `credit_balance` (SaaS operating balance); soft-delete |
| `bot_members` | `owner` / `manager` per user per bot |
| `bot_access_codes` | Invite codes for managers |
| `chats` | Telegram chats bound to a bot |
| `rules` | Per-**chat** moderation rules (preset or custom) |
| `moderation_actions`, `moderation_decisions` | Decision journal (UI; code paths still use `audit`) |
| `chat_statistics` | Aggregated stats |
| `credit_transactions` | Append-only SaaS ledger — [billing-design.md](billing-design.md) |
| `promo_codes`, `promo_redemptions` | Purchase promo codes (SaaS) |
| `referrals` | Referral attribution and bonus payouts (SaaS) |

## API surface (authenticated unless noted)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/health` | Public |
| `GET` | `/api/auth/telegram` | Start OIDC; optional `returnTo` |
| `GET` | `/api/auth/telegram/callback` | OIDC callback |
| `GET` | `/api/auth/session` | Current user |
| `POST` | `/api/auth/sign-out` | Clear session |
| `GET/POST` | `/api/bots` | List / create |
| `POST` | `/api/bots/join` | Join by access code |
| `GET/PUT/DELETE` | `/api/bots/:id` | Detail / update / soft-delete |
| `GET` | `/api/bots/:id/logs`, `statistics`, `decisions` | Logs, stats, decision journal |
| `GET/POST` | `/api/bots/:id/credits/*` | Bot balance, allocate from wallet (SaaS, owner) |
| `GET/POST` | `/api/bots/:id/chats/pending` | Pending «add to group» flow |
| `GET/POST/PUT/DELETE` | `/api/bots/:id/chats/:chatId/rules/*` | Per-chat rule CRUD + AI assist |
| `GET/POST` | `/api/bots/:id/chats/:chatId/rule-templates` | Preset catalog / add to chat |
| `GET/POST` | `/api/bots/:id/chats/:chatId/users/*` | Chat users; pardon, unban, reset warnings |
| `GET/POST/DELETE` | `/api/bots/:id/team/*` | Access code, members |
| `GET` | `/api/dashboard` | Cross-bot dashboard |
| `GET/PUT` | `/api/settings/llm` | Self-hosted LLM settings (encrypted key in DB) |
| `GET/POST` | `/api/account/wallet`, `credits/*` | SaaS wallet, checkout, transactions |
| `GET/POST` | `/api/referral/*`, `/api/promo/*` | Referral link, promo apply |
| `GET` | `/api/releases` | Release notes feed for `/release-notes` |
| `POST` | `/api/telegram/webhook/:botId` | **Public** (secret header) |
| `POST` | `/api/billing/yookassa/webhook` | **Public** (SaaS payment webhook) |
| `POST` | `/api/telegram/login-bot/webhook` | **Public** (login bot fallback) |

## Project structure (high level)

```
pages/           # Nuxt UI (bots, login, dashboard, account/billing, release-notes, settings/llm)
assets/brand/    # Vendored design tokens + DESIGN.md (see sync-brand-* scripts)
components/ui/   # AppButton, AppCard, … — design system primitives
i18n/locales/    # en.json, ru.json — admin UI strings
composables/     # useAppLocale, usePageBreadcrumbs, …
components/      # layout, dashboard, bots, audit (decision journal cards)
server/api/      # Nitro routes
server/core/     # Moderation, dashboard, bot lifecycle, billing
server/database/ # Drizzle schema, repositories, migrations
lib/             # Isomorphic helpers (e.g. auth returnTo, APP_LINKS)
middleware/      # Global auth redirect
```

## Engineering rules

- **Package manager:** Bun only (`bun install`, `bun test`, `bun run dev`)
- **Commits / code / comments:** English
- **User communication:** Russian
- **Env:** `.env` local only; `.env.example` committed
- **Bot route param:** use `requireBotIdParam(event)` from `server/utils/get-bot-id-param.ts`
- **Tests:** unit tests under `tests/unit/`; run `bun test` after `server/**` changes
- **Admin UI strings:** no hardcoded copy in pages/components — use `$t()` / keys in `i18n/locales/`; see [i18n.md](i18n.md)

## Dev HTTPS tunnel

Telegram requires HTTPS for webhooks and OIDC. On dev machine:

```bash
# terminal 1
bun run dev

# terminal 2
make tunnel
# copy https://….trycloudflare.com into .env as BASE_URL
```

`make tunnel` runs `cloudflared` with `TUNNEL_TRANSPORT_PROTOCOL=http2` (QUIC often blocked on LAN).

**Do not use localtunnel** — deprecated in this project.

## Ports

| Environment | Port |
|-------------|------|
| `bun run dev` | 3001 |
| Docker / production | 3000 |

## Security notes

- `returnTo` after login validated in `lib/auth-return-to.ts` (same-origin paths only)
- API routes (except auth start/callback, webhook, health) require session via `server/middleware/api-auth.ts`
- Bot operations require `bot_members` membership (`requireBotAccess`). Owner and manager share operational parity (chats, rules, moderation); **owner only** for bot delete, access codes, team membership changes, and SaaS purchase/allocate. The owner row cannot be removed from the team
