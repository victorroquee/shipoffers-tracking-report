# Phase 1: API Integration Fix - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the broken mock API calls in `lib/shipoffers.ts` and `app/api/sync/route.ts` with correct Shipoffers and 17track API integration. Real order and tracking data flows through the system.

</domain>

<decisions>
## Implementation Decisions

### API Credentials
- **D-01:** Shipoffers API key and store_id are pending from Ben Schulz / Shipoffers tech team (as of 2026-05-05). Code should be written with correct auth pattern (api_key query param + store_id in path) using env vars — values will be plugged in when received.
- **D-02:** 17track API key is available: `EC7B7857B4D6A57323E6CA566835106E`. Configure in `.env.local` as `SEVENTEENTRACK_API_KEY`.
- **D-03:** New env var `SHIPOFFERS_STORE_ID` must be added (does not exist yet in `.env.local`).

### Shipoffers Admin Access
- **D-04:** Admin panel available at `https://etracker.shipoffers.com/admin/login` (user: `oggroupglobal@gmail.com`). Can be used to verify API responses match dashboard data during testing.

### Email Template for Delayed Orders
- **D-05:** User provided a pt-BR email template for delayed order alerts. Template structure: subject with order number, body with order/customer/address details, 3-point ask (status atual, motivo do atraso, previsao de entrega). Adapt to English or keep bilingual as needed. Template will be used when implementing alert emails (existing in `lib/mailer.ts`).

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

### API Integration
- `.planning/REQUIREMENTS.md` §API Integration — Requirements API-01 through API-05
- `.planning/PROJECT.md` §Context — Real Shipoffers API auth and endpoint documentation
- `lib/shipoffers.ts` — Current (broken) Shipoffers client to rewrite
- `lib/tracking.ts` — Current 17track client (chunking already correct, needs real key)
- `app/api/sync/route.ts` — Current sync route to rewrite

### Data Model
- `prisma/schema.prisma` — Order and OrderEvent models (field mapping target)

### Existing Plans
- `.planning/phases/01-api-integration-fix/01-01-PLAN.md` — Rewrite Shipoffers API client
- `.planning/phases/01-api-integration-fix/01-02-PLAN.md` — Rewrite sync route with full pipeline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/tracking.ts`: 17track client with chunking (40 codes/request) and status mapping — mostly correct, needs real API key
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

- Email template provided by user follows a specific format: subject line with order number, body with 3 data points (pedido, cliente, endereco) and 3 questions (status, motivo, previsao). This should be the basis for `lib/mailer.ts` alert content.
- Admin panel access allows manual verification of API responses during development.

</specifics>

<deferred>
## Deferred Ideas

- SMTP credentials (Gmail App Password) — needed for Phase 3/4, not Phase 1
- Production DASHBOARD_USER/PASS and CRON_SECRET — Phase 4 (Production Infrastructure)

</deferred>

---

*Phase: 01-API Integration Fix*
*Context gathered: 2026-05-05*
