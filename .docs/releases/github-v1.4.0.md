## [1.4.0] - 2026-08-10

Self-hosted Telegram AI moderation admin — **22** commits.

## What's Changed

### Added

- **ui**: page header spacing, release notes type, bot status switch in [`fc9c0f7`](https://github.com/telemodai/app/commit/fc9c0f7b768132eff51f88be51c01cc559a142ab)
- **ui**: audit cards, empty states, and cabinet UX polish in [`de7a6cd`](https://github.com/telemodai/app/commit/de7a6cd00013676bb9c76065bd23e3a1c99cfe30)
- **ui**: telegram deep link pill for chat id on bot detail in [`d2af77c`](https://github.com/telemodai/app/commit/d2af77ca438100054d04d144a18e9d9ecb1c4a21)
- **ui**: migrate admin typography to standard Tailwind scale in [`587d5e7`](https://github.com/telemodai/app/commit/587d5e7f4073233a4f9064e0b8e5f1bbd0f87028)
- **ui**: migrate admin pages to design system in [`6b90536`](https://github.com/telemodai/app/commit/6b905365583d7518e0295b17c970b1fcccab871f)
- **ui**: add design system primitives and layout shell in [`a4b242b`](https://github.com/telemodai/app/commit/a4b242b50126c239fc32b3dcf255c1e74bddface)
- **ui**: add Tailwind 4 foundation and vendored brand CSS in [`13523b9`](https://github.com/telemodai/app/commit/13523b9709e8c5ec33421a2f84d3ce4e6d9970f0)
- **moderation**: include Telegram user id and username in LLM prompt in [`ad3a68b`](https://github.com/telemodai/app/commit/ad3a68b14d8ee1cf2eb10a0e27f145dc191687f5)

### Fixed

- **ui**: chat activation modal layout and header polish in [`10b8343`](https://github.com/telemodai/app/commit/10b8343b8cc76eac8b1544995289a9bb15275095)
- **ui**: place chat id pill inline after title with wrap fallback in [`9128fb6`](https://github.com/telemodai/app/commit/9128fb6e6e45b0f6e071029c925022400579dd58)
- **ui**: use Telegram Web URL for private chat deep links in [`e898832`](https://github.com/telemodai/app/commit/e8988329f621e1d99e19c436a511151908b86b11)
- **ui**: dashboard KPI title spacing and uniform user stat sizes in [`356b63a`](https://github.com/telemodai/app/commit/356b63a1eac841794a2ac3f4050f8ec0e4b78b89)
- **ui**: add breathing room in dashboard KPI cards in [`fee574b`](https://github.com/telemodai/app/commit/fee574b2ba2f9c443f21f71664ce3f35f4ceb77c)
- **ui**: emphasize chat card title over metadata in [`ad4725d`](https://github.com/telemodai/app/commit/ad4725de5e60e93af4e5204fe2beca1dff61ab08)
- **ui**: smaller badge type with restored pill padding in [`270fb9a`](https://github.com/telemodai/app/commit/270fb9a95719feb4b5f888fceaeee8b38f551e3c)
- **ui**: pointer cursor on tm-tab controls in [`d4d1612`](https://github.com/telemodai/app/commit/d4d1612d79e1af7085dbdec5c5ab6a69e8d739fa)
- **ui**: tighten type hierarchy — smaller base, larger stats, compact badges in [`a8c35e7`](https://github.com/telemodai/app/commit/a8c35e770a4fa5b3a5569e32a9ea88d5ebc5cef1)
- **ui**: responsive rule modal layout and taller rule text field in [`1778e06`](https://github.com/telemodai/app/commit/1778e06e2d8eee3063a644ece59a238b2e49a4f4)
- **ui**: polish cabinet UX on top of design system migration in [`9a6f578`](https://github.com/telemodai/app/commit/9a6f5783b803589d3a74720a2e83805fde51b336)
- **test**: repair operator imports and Windows path assertions in [`d159c0b`](https://github.com/telemodai/app/commit/d159c0bbd4f5aa9faa783844497255ca7c3aea0e)

### Documentation

- document admin design system and moderation color appendix in [`1bf51d2`](https://github.com/telemodai/app/commit/1bf51d2077351f327b17423176c5b3423d5a1adb)

### Refactoring

- adopt @/ path alias for cross-directory imports in [`533c1af`](https://github.com/telemodai/app/commit/533c1af419f33a12986083bf110604138ca3f965)