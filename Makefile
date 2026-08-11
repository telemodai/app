IMAGE ?= ghcr.io/telemodai/app
TAG   ?= local
DEV_PORT ?= 3001

# Load project .env so make tunnel sees TUNNEL_TOKEN (file is gitignored).
ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: docker-build tunnel

docker-build:
	docker build -t $(IMAGE):$(TAG) .

# Named Cloudflare Tunnel (TUNNEL_TOKEN from .env). HTTP/2 — QUIC often blocked on LAN.
# Ingress to localhost:$(DEV_PORT) is configured in the Cloudflare dashboard — not localtunnel.
tunnel:
	bunx cloudflared tunnel --protocol http2 run
