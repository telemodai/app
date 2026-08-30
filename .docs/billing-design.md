# Billing design

> Technical design for SaaS credits and self-hosted deployment mode.
> Economics and tiers: [billing-economics.md](billing-economics.md).

## Deployment modes

```env
DEPLOYMENT_MODE=self-hosted   # default
DEPLOYMENT_MODE=saas
```

| | self-hosted | saas |
|---|-------------|------|
| LLM config | Instance settings UI (api_key, base_url, model); env optional override | Platform env only |
| Credits | Disabled (billing layer no-op) | User wallet + per-bot operating balance |
| Purchase UI | Hidden | Account page (`/account/billing`) — **owner only** |
| Free 100 credits | N/A | Once per **user** on first registration (user wallet) |
| Bot balance | N/A | Owner allocates from wallet; manager **read-only** |
| LLM usage analytics | Optional log | Persist every moderation call |

Expose `deploymentMode` to client via runtime config for UI conditionals.

## Wallet model v2 (SaaS)

Two balance levels:

1. **User wallet** (`users.credit_balance`) — purchases, signup grant, referral bonuses, reclaim from deleted bots.
2. **Bot operating balance** (`bots.credit_balance`) — moderation debits only; funded by owner via allocate from wallet.

```
User wallet  ──allocate──►  Bot operating balance  ──debit_moderation──►  spent
     ▲                              │
     └──────── reclaim (soft delete)┘
```

### Role matrix

| Action | Owner | Manager |
|--------|-------|---------|
| See user wallet | yes | no |
| Purchase credits | yes | no |
| Allocate wallet → bot | yes | no |
| See bot operating balance | yes | yes (read-only) |
| Moderation debits | bot balance | bot balance |

### Migration (existing data)

- Set `users.credit_balance = 0` for all users.
- **Do not** move existing `bots.credit_balance` to user wallet — treat as already allocated.
- Signup grant: new users only on first registration → user wallet. Users who already have a `grant_signup` ledger row (including legacy bot-level rows) do not receive another 100.

### Rejected alternatives (do not re-introduce)

- Per-bot-only wallet with credits lost on hard delete
- Pure user wallet without per-bot operating balance (“общий котёл” — one hot chat drains all bots)
- Manager paying from own wallet or purchasing for the bot
- Referral “pending pool” + manual claim to a chosen bot

## Payment provider

**YooKassa** for SaaS checkout and webhooks.

Behind `BillingProvider` abstraction so the core credit domain does not depend on YooKassa types.

```typescript
interface BillingProvider {
  createCheckout(input: {
    userId: string;
    purchaserUserId: string;
    packageId: string;
  }): Promise<{ checkoutUrl: string }>;

  verifyWebhook(payload: unknown, headers: Headers): Promise<BillingWebhookEvent | null>;
}

interface BillingWebhookEvent {
  providerPaymentId: string;
  purchaserUserId: string;
  credits: number;
  amountRub: number;
  status: "paid" | "refunded" | "failed";
}
```

`CreditService`: grant, debit, allocate, reclaim, reconcile, ledger — payment-agnostic.

## Credit ledger

`credit_transactions` (append-only audit log). Each row = one financial event.

| Field | Notes |
|-------|-------|
| `user_id` | Nullable; wallet-level events |
| `bot_id` | Nullable; bot-level events (at least one of `user_id` / `bot_id` required) |
| `type` | See table below |
| `amount` | Signed integer (+ / −) |
| `balance_after` | Snapshot after apply (wallet or bot, per row) |
| `reference` | Payment id, message id, allocate batch id, etc. |
| `actor_user_id` | Purchaser, allocator, etc.; null for system |
| `metadata` | JSON (package id, bot id for allocate, …) |

`users.credit_balance` and `bots.credit_balance` — denormalized caches for fast pre-check.

### Transaction types

| Type | Level | Meaning |
|------|-------|---------|
| `grant_signup` | user | 100 credits on first registration |
| `purchase` | user | Paid package credited to wallet |
| `referral_bonus` | user | Referee or referrer bonus |
| `allocate` | user (−) and bot (+) | Owner moves credits wallet → bot (paired ledger rows, shared reference) |
| `reclaim` | bot (−) and user (+) | Soft delete: remaining bot balance returned to owner wallet |
| `debit_moderation` | bot | −1 per successful moderation |
| `admin_adjust` | user or bot | Operator CLI |
| `reconcile_fix` | user or bot | Background safety net |

**User-visible history** (account page): `purchase`, `grant_signup`, `referral_bonus`, `allocate` (user side), `reclaim` (user side). Moderation debits appear in bot context only.

**`admin_adjust`:** operator-only via `cli credits grant` (SaaS). Metadata includes `reason`, `source: cli`. Idempotent when `--reference` repeats.

### Balance updates (moderation)

**Hot path (success):**

1. Pre-check **bot** `credit_balance > 0` (saas only)
2. LLM call
3. On HTTP 200 + non-empty content → conditional debit on **bot**:

```sql
UPDATE bots SET credit_balance = credit_balance - 1
WHERE id = $1 AND credit_balance >= 1 AND deleted_at IS NULL
RETURNING credit_balance;
```

4. Insert `debit_moderation` ledger row (idempotent on `bot_id + chat_id + message_id`)

**No debit:** LLM throw/timeout, empty body, JSON parse failure, deleted bot.

### Allocate / reclaim

**Allocate** (owner): atomic user wallet −N, bot +N; paired `allocate` ledger rows.

**Reclaim** (soft delete): transfer entire bot `credit_balance` to owner user wallet; bot balance → 0; paired `reclaim` ledger rows. Idempotent if bot balance already 0.

### Reconciliation (background / nightly)

For each **non-deleted** bot and each user with wallet activity:

```
expected_balance = sum(credit_transactions.amount)  -- per entity
actual_balance = credit_balance column
if mismatch → technical log + reconcile_fix transaction
```

Skip soft-deleted bots (`deleted_at IS NOT NULL`) — balance should be 0 after reclaim.

Cross-check: `count(user_messages where is_moderated = true)` ≈ debit rows per bot.

## Bot soft delete

Bots are not hard-deleted. Preserves ledger, chats, rules, and audit history.

| Field | On delete |
|-------|-----------|
| `deleted_at` | `now()` |
| `is_active` | `false` |
| `token` | `NULL` (security) |

**Operational check** — single helper, use everywhere:

```typescript
isBotOperational(bot) := bot.is_active && bot.deleted_at == null
```

**Delete flow (owner only):** reclaim → remove Telegram webhook (best-effort) → set soft-delete fields.

**Restore:** re-add bot with same `@username` token if row exists with `deleted_at` set and `owner_user_id` matches session → clear `deleted_at`, refresh token/name/avatar, re-register webhook. Bot operating balance starts at 0 (credits already on owner wallet after reclaim). Different owner → 409.

**API:** deleted bot → **404** (not 403) for all members including managers with old bookmarks.

**Webhook:** ignore updates for deleted bots.

## LLM usage analytics

Table `llm_usage` — one row per SaaS moderation attempt that reached the LLM:

| Field | Notes |
|-------|-------|
| `bot_id`, `chat_id`, `message_id` | Correlation |
| `model` | e.g. gpt-4.1-nano |
| `prompt_tokens`, `completion_tokens` | From API `usage` |
| `estimated_cost_rub` | Computed from token rates at call time |
| `success` | HTTP 200 + content |
| `created_at` | |

Planning COGS until data exists: **0.05 ₽ / successful moderation** — see [billing-economics.md](billing-economics.md).

## Moderation flow (saas)

```
saveMessage(is_moderated = false)
bot not operational (deleted/inactive) → return
no active rules → return
bot credit_balance <= 0 → return
LLM → log llm_usage
  success (HTTP 200 + content) → debit bot + is_moderated = true + decision
  parse failure → no debit, is_moderated stays false
```

## Purchases

**Owner** starts checkout from account billing page; credits accrue to **user wallet**.

**Checkout** inserts `provider_payments` (`pending`) with `user_id`, package snapshot, purchaser.

**Webhook** and **sync** grant credits idempotently (`reference` = YooKassa payment id).

**Endpoints:**

- `POST /api/account/credits/checkout`
- `POST /api/account/credits/sync`
- Return URL: `/account/billing?payment=return`

**Nightly:** `billing:reconcile-stale-payments` polls stale `pending` rows.

`credit_transactions` (ledger) and `provider_payments` (provider lifecycle) are separate tables.

## Purchase promo codes (SaaS only)

Percent-discount promo codes for credit package checkout. Self-hosted: no promo UI, API, or CLI in product flows.

### Rules

- Discount on **RUB price only**; package **credits stay full**
- Charged amount: `max(1, floor(price * (100 - percent) / 100))` (100% → 1 ₽)
- One successful redemption per user per code
- Cookie `tg_promo_code` is UX-only; checkout re-validates server-side

### Checkout flow

1. User applies code on account billing → `POST /api/promo/apply` sets cookie
2. Checkout validates, charges discounted amount to YooKassa
3. On paid webhook/sync: grant full package credits to **user wallet**, insert redemption
4. Ledger `purchase` metadata includes promo fields when discounted

## Product referrals (SaaS only)

In-product credit rewards for inviting new paying users. Self-hosted: no referral UI or API.

### Config (`lib/referral-config.ts`)

- `REFERRAL_COOKIE_DAYS = 30` (last-click attribution)
- `REFERRAL_REFEREE_PERCENT` / `REFERRAL_REFERRER_PERCENT` (default 10 / 10)

### Attribution

- Personal link `/r/:code` or `?ref=` on landing/login
- Cookie `tg_referral_code` — last click within 30 days; self-referral ignored
- Checkout snapshots cookie into `provider_payments.referral_code`

### Rewards (first successful purchase only)

- **Referee:** `floor(package_credits * REFERRAL_REFEREE_PERCENT / 100)` → **user wallet immediately**
- **Referrer:** `floor(package_credits * REFERRAL_REFERRER_PERCENT / 100)` → **user wallet immediately**
- Ledger type `referral_bonus` with metadata `{ referral_id, role, percent, base_credits, provider_payment_id }`
- No pending/claim flow; no bot selection

### Anti-abuse

- No self-referral; referrer account must predate referee
- One referral lifecycle per referee; first purchase only
- Skip zero-bonus sides; idempotent on `provider_payment_id`

### APIs

- `POST /api/referral/attribution` — set cookie
- `GET /api/referral/link` — current user's share link

## Credit packages (config)

| package_id | Credits | Price RUB |
|------------|---------|-----------|
| `start` | 10,000 | 490 |
| `growth` | 50,000 | 1,990 |
| `max` | 100,000 | 3,990 |

Stored in code or config table; YooKassa amount derived from package.

## Operator CLI

```bash
docker compose exec app cli credits grant --user-id USER --amount 5000 --reason "support"
docker compose exec app cli promo create --code SAVE10 --percent 10
```

Ledger type `admin_adjust`; no YooKassa payment row. Self-hosted: billing CLI exits with error.

## Implementation tracker

GitHub epic [#173](https://github.com/telemodai/app/issues/173) and sub-issues #174–#182.
