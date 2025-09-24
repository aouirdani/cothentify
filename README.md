# Cothentify (Monorepo)

A macOS-optimized SaaS platform for content authenticity — Web (Next.js) + API (Fastify) + Prisma + Postgres + Redis. This repo contains an initial scaffold aligned to the project brief.

## Quick Start

- Prereqs: Node 20+, pnpm, Docker Desktop
- Copy envs: `cp .env.example .env` (update secrets as needed)
- Start infra: `docker compose up -d`
- Install deps: `pnpm install`
- Dev servers: `pnpm dev` (web on :3000, api on :4000)

## Apps

- apps/web — Next.js 14 (App Router, Tailwind, NextAuth, Zustand)
- apps/api — Fastify + Prisma + Redis/BullMQ + Swagger

## macOS Setup (Recommended)

- Install Homebrew, Node 20 via nvm, Postgres/Redis via Docker
- VS Code extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense

## Environments

See `.env.example` for required variables across web and api. Use dedicated `.env.local` per app for overrides if desired.

## Database

- Prisma schema is under `apps/api/prisma/schema.prisma`.
- Run migrations: `pnpm -C apps/api prisma:migrate`.

## Background Worker

- Start Redis with Docker (already in compose).
- Run the API worker in another terminal:
  - Dev: `pnpm -C apps/api dev:worker`
  - Prod build: `pnpm -C apps/api build && pnpm -C apps/api start:worker`

- Optional: Run the worker in Docker with compose:
  - `docker compose up -d worker` (uses envs from `.env` if present)

## API in Docker

- Production-style container: `docker compose up -d api`
- Dev with live reload: `docker compose up -d api-dev`
  - Mounts the repo and runs `pnpm -C apps/api dev` inside the container.

## Try It

- Web health: http://localhost:3000/api/health
- API docs: http://localhost:4000/docs
- Dashboard (quick test UI): http://localhost:3000/dashboard
- Content management (protected): http://localhost:3000/content
- Create content: `POST http://localhost:4000/api/v1/content` { title, body, language }
- Enqueue analysis: `POST http://localhost:4000/api/v1/content/:id/analyze`
- Projects API:
  - List: `GET http://localhost:4000/api/v1/projects` (JWT)
  - Create: `POST http://localhost:4000/api/v1/projects` (ADMIN/MEMBER)
  - Get: `GET http://localhost:4000/api/v1/projects/:id`
  - Update: `PUT http://localhost:4000/api/v1/projects/:id` (ADMIN/MEMBER)

## Optional: Hugging Face Detector (Free)

- You can point the API to a free HF Space or Inference endpoint to augment detection.
- Set in `.env`:
  - `ENABLE_HF_DETECTOR=true`
  - `HUGGINGFACE_API_URL=<Space API or Inference endpoint>`
  - `HUGGINGFACE_API_TOKEN=<token>` (optional if Space is public)
- Expected outputs:
  - Either a JSON with `ai_probability` (0–100)
  - Or a classification array with labels like `AI` vs `Human` and a `score` in [0,1]
- The ensemble will include HF when enabled, alongside OpenAI/Anthropic stubs.

<!-- Lead capture removed per request -->

## Stripe Checkout (Optional)

- To enable real checkout links on Pricing:
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `STRIPE_PRICE_ESSENTIAL_MONTHLY=price_...`
  - `STRIPE_PRICE_ESSENTIAL_YEARLY=price_...`
  - `STRIPE_PRICE_PREMIUM_MONTHLY=price_...`
  - `STRIPE_PRICE_PREMIUM_YEARLY=price_...`
  - `STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...`
  - `STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...`
- Success and cancel pages:
  - `/checkout/success`
  - `/checkout/cancel`
- If Stripe keys or price IDs are missing, checkout falls back to a mock success redirect.

## RBAC & Auth (Basic)

- JWT required for most content routes (list/create/update, enqueue). Bearer token via `Authorization: Bearer <token>`.
- Dev helper to mint tokens:
  - `POST http://localhost:4000/api/v1/auth/dev-login` with `{ "email": "you@example.com", "role": "ADMIN" }` (roles: ADMIN, MEMBER, CLIENT)
  - Not available in production.
- Public endpoints:
  - `GET /api/v1/health`, `POST /api/v1/content/analyze` (ad-hoc analysis)

## Web → API Proxy

- Server-side proxy route: `apps/web/app/api/proxy/[...path]/route.ts`
  - Forwards requests to `${NEXT_PUBLIC_API_URL}/<path>`
  - Signs a short-lived JWT with `API_JWT_SECRET` (or `JWT_SECRET` fallback) including `{ email, role }` from NextAuth session
  - Use from the browser: call `/api/proxy/api/v1/content` etc.
- Set `API_JWT_SECRET` in `.env` to the same value as the API `JWT_SECRET`.

## Security Notes

- Secrets must not be committed. Use 1Password, Doppler, or AWS Secrets Manager for production.
- JWT and NextAuth secrets should be strong and rotated.

## License

UNLICENSED — proprietary. All rights reserved.
## Payments (Stripe + PayPal)

Env (web/.env.local):

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENTIAL_MONTHLY=price_...
STRIPE_PRICE_ESSENTIAL_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...

PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Stripe

- Create Checkout Session

```
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"plan":"essential","billing":"monthly"}' \
  http://localhost:3000/api/checkout
```

- Webhook (run Stripe CLI):

```
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

PayPal

- Create order:

```
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"plan":"essential","billing":"monthly"}' \
  http://localhost:3000/api/paypal/create
```

- Capture order:

```
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"orderId":"REPLACE"}' \
  http://localhost:3000/api/paypal/capture
```

Notes

- Payment pages use `dynamic = "force-dynamic"` and Suspense around `useSearchParams`.
- Webhooks update a minimal in-memory repository (`apps/web/lib/repo/subscriptions.ts`). Replace with your DB.
