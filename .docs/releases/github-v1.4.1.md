## [1.4.1] - 2026-08-12

Telemodai — Telegram AI moderation admin — **13** commits.

## What's Changed

### Added

- **ui**: bot list status LED and sync favicons from brand in [`0b11315`](https://github.com/telemodai/app/commit/0b113150918187c9dd63dce0c8d7977404a029ba)
- **moderation**: write reasoning in the message language in [`5ecabcb`](https://github.com/telemodai/app/commit/5ecabcb4fb6582c108f0aef4c3da6461c1569803)
- **ui**: mobile header burger and responsive chat cards in [`5c85bf9`](https://github.com/telemodai/app/commit/5c85bf969b551b05699cc948f5866926945ee23a)

### Fixed

- **cloud**: disable Nuxt telemetry in nuxt.config ([#170](https://github.com/telemodai/app/issues/170)) in [`714c406`](https://github.com/telemodai/app/commit/714c406b0e72eb0196c8a3b46807e22eb68398ac)
- **cloud**: on-demand tunnel and dev browser login for Cloud Agents ([#169](https://github.com/telemodai/app/issues/169)) in [`689a52e`](https://github.com/telemodai/app/commit/689a52ea1bcd2bf52d85e998b2486e181f51c02e)
- **cloud**: reliable dev autostart via .cursor/environment/scripts/cloud.sh ([#168](https://github.com/telemodai/app/issues/168)) in [`2bfc6d7`](https://github.com/telemodai/app/commit/2bfc6d76a5bc8ec0ec4c33e2fd1f98f72f337ba7)
- **cloud**: disable Nuxt telemetry during environment install ([#167](https://github.com/telemodai/app/issues/167)) in [`699e000`](https://github.com/telemodai/app/commit/699e00064a5ce583bbcb0858aa166a546dc26bfa)
- **cloud-env**: native PostgreSQL 17 for Cloud Agent environments in [`ba7bfeb`](https://github.com/telemodai/app/commit/ba7bfeb13943608f0c9730830ba0e455d40fc676)

### Chores

- **skills**: move workflow skill to .agents/skills in [`4cbb493`](https://github.com/telemodai/app/commit/4cbb4931a2eb2f4634f4c545e71c64bf20b39f2d)
- **skills**: install full workflow skill via skills CLI in [`97dc5c4`](https://github.com/telemodai/app/commit/97dc5c49a243158e89c2c45f1b850eb374110386)
- **skills**: add workflow skill stub under .cursor/skills in [`5cca6d0`](https://github.com/telemodai/app/commit/5cca6d0cebf6df85e37615da26beabe65d368503)
- **cloud**: add Cloud Agent environment (Docker Postgres, Bun, Nuxt dev, Cloudflare tunnel) in [`35001ec`](https://github.com/telemodai/app/commit/35001ecfee79d0e7d373b2c54c044b1b0207ef1a)
- **dev**: switch make tunnel to named Cloudflare tunnel in [`7e5adbd`](https://github.com/telemodai/app/commit/7e5adbd77b053b6324fe6bf4b0d6fa0d436c4c57)