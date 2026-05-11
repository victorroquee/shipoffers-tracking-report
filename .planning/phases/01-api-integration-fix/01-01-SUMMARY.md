---
phase: 01-api-integration-fix
plan: "01"
subsystem: api-client
tags: [shipoffers, basic-auth, api-client, mock-fallback]
dependency_graph:
  requires: []
  provides: [shipoffers-api-client]
  affects: [app/api/sync/route.ts]
tech_stack:
  added: []
  patterns: [HTTP Basic Auth, axios pagination, dual mock fallback]
key_files:
  created: []
  modified:
    - lib/shipoffers.ts
    - app/api/sync/route.ts
decisions:
  - "HTTP Basic Auth via SHIPOFFERS_API_USER + SHIPOFFERS_API_PASS (per D-01)"
  - "Dual mock fallback: USE_MOCK=true OR missing credentials (per D-10)"
  - ".env.local retains USE_MOCK=true until Ben Schulz provides credentials"
  - "Endpoint pattern: /api/stores/{store_id}/*.json with .json suffix on all paths (per D-09)"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-05-11"
---

# Phase 01 Plan 01: Shipoffers API Client Rewrite Summary

**One-liner:** HTTP Basic Auth Shipoffers client with dual mock fallback and correct /api/stores/{store_id}/*.json endpoints.

## What Was Built

Rewrote `lib/shipoffers.ts` from scratch to replace broken Bearer token auth and wrong `/orders` endpoint with:

- HTTP Basic Auth using `SHIPOFFERS_API_USER` and `SHIPOFFERS_API_PASS` env vars
- Correct endpoints per Swagger: `/api/stores/{store_id}/orders.json`, `/api/stores/{store_id}/shipments.json`, `/api/stores/{store_id}/orders/{id}/shipments.json`
- Pagination via `page` and `per_page` params (default 250), looping until response is shorter than page size
- Dual mock fallback: triggers if `USE_MOCK=true` OR if either credential env var is empty/undefined
- Three exported functions: `fetchAllOrders`, `fetchAllShipments`, `fetchOrderShipments`
- Two exported interfaces: `ShipoffersOrder` and `ShipoffersShipment` (Swagger-based field names)

Updated `.env.local` in worktree to replace `SHIPOFFERS_API_KEY` with `SHIPOFFERS_API_USER`, `SHIPOFFERS_API_PASS`, and `SHIPOFFERS_STORE_ID` (all empty, pending from Ben Schulz).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update .env.local with Basic Auth variables | (gitignored, not committable) | .env.local |
| 2 | Rewrite lib/shipoffers.ts with HTTP Basic Auth and correct endpoints | 22b4fce | lib/shipoffers.ts, app/api/sync/route.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated sync route to compile against new ShipoffersOrder interface**
- **Found during:** Task 2 (tsc --noEmit)
- **Issue:** `app/api/sync/route.ts` used old flat fields (`o.shipped_at`, `o.customer_name`, `o.tracking_code`, `o.destination_country`) from `MockOrder`. New `ShipoffersOrder` uses Swagger field names (`o.shipping_address.country`, `o.email`, etc.), causing 12 TypeScript errors.
- **Fix:** Updated sync route to use new interface fields: `o.shipping_address?.country`, `o.shipping_address?.name`, `o.email`. Used `o.created_at` as proxy for shipped date (real field TBD when API responds). This is a bridge until plan 01-02 fully rewrites the sync route.
- **Files modified:** `app/api/sync/route.ts`
- **Commit:** 22b4fce

**2. [Deviation - Gitignored] .env.local cannot be committed**
- **Found during:** Task 1
- **Issue:** `.env.local` is in `.gitignore` (correct per threat model T-01-02 — secrets must not be committed). The plan assumed it could be committed, but it cannot.
- **Fix:** Created `.env.local` in the worktree with correct content. Changes are in place for local development but not tracked in git (correct behavior for secrets).
- **Impact:** None — the file exists with correct content, just not version-controlled.

## Known Stubs

- `SHIPOFFERS_API_USER=""` and `SHIPOFFERS_API_PASS=""` in `.env.local` — credentials pending from Ben Schulz (per D-02). System falls back to mock data until credentials arrive.
- `SHIPOFFERS_STORE_ID=""` in `.env.local` — same pending status.
- `fetchAllShipments` mock fallback returns `[]` — `mock-data.ts` has no shipment mock data. This is intentional; plan 01-02 will wire real shipment data when credentials arrive.

## Threat Surface Scan

No new security surface introduced beyond what was planned. Verified:
- `.env.local` contains `SHIPOFFERS_API_USER=""` (not committed — gitignored per T-01-02)
- Basic Auth header constructed with `Buffer.from(user:pass).toString('base64')` — standard approach
- All API calls to `https://api.shipoffers.com` (HTTPS only per T-01-01)
- No unauthenticated fallback path — missing credentials → mock mode, not bare API call (T-01-03)

## Self-Check: PASSED

- FOUND: lib/shipoffers.ts
- FOUND: app/api/sync/route.ts
- FOUND: .planning/phases/01-api-integration-fix/01-01-SUMMARY.md
- FOUND: commit 22b4fce
