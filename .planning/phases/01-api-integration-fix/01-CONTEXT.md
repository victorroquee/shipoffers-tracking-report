# Phase 1: API Integration Fix - Context

**Gathered:** 2026-05-11 (updated from 2026-05-05)
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the broken mock API calls in `lib/shipoffers.ts` and `app/api/sync/route.ts` with correct Shipoffers and 17track API integration. Real order and tracking data flows through the system.

</domain>

<decisions>
## Implementation Decisions

### API Authentication (UPDATED 2026-05-11)
- **D-01:** Shipoffers API uses **HTTP Basic Auth** (NOT api_key query parameter as initially assumed). Confirmed by `www-authenticate: Basic realm="API Authorization"` response header. The Swagger UI shows `api_key` query param but the actual API enforces Basic Auth.
- **D-02:** Shipoffers API credentials (Basic Auth username + password) are **pending from Ben Schulz**. The etracker login (`oggroupglobal@gmail.com` / password) does NOT work for API authentication — they are separate credential sets. Message sent to Ben requesting: (1) API Basic Auth credentials, (2) store_id for OG Group.
- **D-03:** New env vars needed: `SHIPOFFERS_API_USER` and `SHIPOFFERS_API_PASS` for Basic Auth (replacing the single `SHIPOFFERS_API_KEY` approach). Plus `SHIPOFFERS_STORE_ID`.
- **D-04:** 17track API key is configured: `EC7B7857B4D6A57323E6CA566835106E` (inserted in `.env.local` on 2026-05-11).

### Shipoffers API Endpoints (confirmed via Swagger)
- **D-05:** Orders: `GET /api/stores/{store_id}/orders.json` with params: `page`, `per_page`, `updated_at_start`, `updated_at_end`, `order_number`, `email`
- **D-06:** Shipments (all): `GET /api/stores/{store_id}/shipments.json` with same filter params
- **D-07:** Shipments (per order): `GET /api/stores/{store_id}/orders/{order_id}/shipments.json`
- **D-08:** Single order: `GET /api/stores/{store_id}/orders/{order_id}.json`
- **D-09:** Format is `.json` suffix on all endpoints (not Accept header)

### Execution Strategy
- **D-10:** Proceed with mock data for Shipoffers while credentials are pending. Rewrite code with correct Basic Auth + endpoint structure so it's ready to go when credentials arrive.
- **D-11:** 17track integration can be tested with real API key immediately.

### Shipoffers Admin Access
- **D-12:** Admin panel at `https://etracker.shipoffers.com/admin/login` (user: `oggroupglobal@gmail.com`, pass: `bmr*gtg6cda6XEK@crg`). Can verify API responses match dashboard data once API credentials arrive.

### Email Template for Delayed Orders
- **D-13:** User provided pt-BR email template for delayed order alerts. Template structure: subject with order number, body with order/customer/address details, 3-point ask (status atual, motivo do atraso, previsao de entrega).

### Claude's Discretion
- Field mapping from Shipoffers API response to Prisma Order model — Claude maps based on actual API response shape
- Error handling strategy for sync cron (log-and-continue vs retry)
- Whether to keep USE_MOCK toggle for local dev
- How to handle multi-shipment orders (current schema has 1 trackingCode per Order)
- Fix the `shipofffersId` typo (3 f's) in Prisma schema if safe to do so

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Documentation
- `https://api.shipoffers.com/swagger/#!/` — Swagger UI (interactive docs)
- `https://api.shipoffers.com/api/swagger_doc/stores.json` — Full endpoint specs (orders, shipments, items, products, returns, inventory)
- `.planning/REQUIREMENTS.md` §API Integration — Requirements API-01 through API-05
- `.planning/PROJECT.md` §Context — Project context and constraints

### Source Code (to rewrite)
- `lib/shipoffers.ts` — Current (broken) Shipoffers client — uses wrong auth (Bearer) and wrong endpoint (/orders)
- `lib/tracking.ts` — Current 17track client (chunking correct, needs real key — now configured)
- `app/api/sync/route.ts` — Current sync route to rewrite

### Data Model
- `prisma/schema.prisma` — Order and OrderEvent models (field mapping target)

### Existing Plans
- `.planning/phases/01-api-integration-fix/01-01-PLAN.md` — Rewrite Shipoffers API client (NEEDS UPDATE: Basic Auth instead of api_key query param)
- `.planning/phases/01-api-integration-fix/01-02-PLAN.md` — Rewrite sync route with full pipeline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/tracking.ts`: 17track client with chunking (40 codes/request) and status mapping — mostly correct, now has real API key
- `lib/delay-rules.ts`: Country-based delay thresholds — working, no changes needed
- `lib/mailer.ts`: Email alert system — will use new template from user
- `lib/mock-data.ts`: Mock data generator — keep for USE_MOCK=true dev mode

### Established Patterns
- Axios-based API clients with `client.get`/`client.post` pattern
- Prisma upsert by unique ID for idempotent syncs
- Cron auth via `x-cron-secret` header check

### Integration Points
- `app/api/sync/route.ts` imports from `lib/shipoffers.ts` and `lib/tracking.ts`
- `prisma.order.upsert` uses `shipofffersId` as unique key
- Dashboard reads from Prisma Order table (no changes needed for display)

</code_context>

<specifics>
## Specific Ideas

- Email template provided by user follows a specific format: subject line with order number, body with 3 data points (pedido, cliente, endereco) and 3 questions (status, motivo, previsao).
- Admin panel access allows manual verification of API responses during development.
- Swagger docs confirmed: shipments endpoint returns tracking numbers separately from orders — sync must fetch both and correlate.

</specifics>

<deferred>
## Deferred Ideas

- SMTP credentials (Gmail App Password) — needed for Phase 3/4, not Phase 1
- Production DASHBOARD_USER/PASS and CRON_SECRET — Phase 4 (Production Infrastructure)
- Scraping etracker as fallback if API credentials never arrive — revisit if Ben doesn't respond

</deferred>

---

*Phase: 01-API Integration Fix*
*Context gathered: 2026-05-11 (originally 2026-05-05, updated with Swagger findings)*
