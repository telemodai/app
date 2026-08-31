## [1.5.0] - 2026-08-31

Telemodai — Telegram AI moderation admin — **10** commits.

## What's Changed

### Added

- **ui**: bot allocate modal and remove per-bot credits page in [`b0099ef`](https://github.com/telemodai/app/commit/b0099effc9d68fdddb7c585681a259f2bfe6f148) ([#181](https://github.com/telemodai/app/issues/181))
- **ui**: add account billing page with wallet and purchase flow in [`4466c46`](https://github.com/telemodai/app/commit/4466c4693d8c27dcc4351918b385ec85644fefc2) ([#179](https://github.com/telemodai/app/issues/179))
- **api**: account billing endpoints and bot allocate in [`0ccbf83`](https://github.com/telemodai/app/commit/0ccbf834c12d5863202b4d8055a13e52ada231d3) ([#175](https://github.com/telemodai/app/issues/175))
- **bots**: soft delete with credit reclaim and restore in [`e287769`](https://github.com/telemodai/app/commit/e2877694a7722afef2532a316a391413f500d626) ([#180](https://github.com/telemodai/app/issues/180))
- **billing**: refactor CreditService for user wallet and bot balance in [`a9914fe`](https://github.com/telemodai/app/commit/a9914feddc9aa0a00c174f1c3094e2e25044c3d7) ([#178](https://github.com/telemodai/app/issues/178))
- **db**: billing v2 schema migration in [`afae56e`](https://github.com/telemodai/app/commit/afae56e48cf948e3192a0de1c1814fd7ac5abe1e) ([#176](https://github.com/telemodai/app/issues/176))

### Fixed

- **ui**: align billing promo state for SSR hydration in [`1bef8ed`](https://github.com/telemodai/app/commit/1bef8edfa97c68f812bad76d282c43a4fb0f83d5)

### Documentation

- document billing wallet model v2 in [`423440d`](https://github.com/telemodai/app/commit/423440d14fd6886142fbf4681307edeaf9569902) ([#174](https://github.com/telemodai/app/issues/174))

### Refactoring

- **referral**: remove pending claim flow, grant bonuses to wallet in [`1fa4c12`](https://github.com/telemodai/app/commit/1fa4c129a8fa792f4e49eeea4a5867d1d90595d0) ([#177](https://github.com/telemodai/app/issues/177))

### Chores

- **billing**: reconcile user wallets, CLI grant target, docs in [`ece1aad`](https://github.com/telemodai/app/commit/ece1aad0601f1677db1fcd8bf358cb6b9741edce) ([#182](https://github.com/telemodai/app/issues/182))