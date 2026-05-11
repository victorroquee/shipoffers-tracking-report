---
phase: 01-api-integration-fix
plan: "02"
subsystem: sync-pipeline
tags: [sync, shipoffers, 17track, prisma, mock]
dependency_graph:
  requires: [shipoffers-api-client]
  provides: [sync-pipeline]
  affects: [app/api/sync/route.ts, lib/shipoffers.ts]
tech_stack:
  added: []
  patterns: [parallel fetch, shipment correlation map, 17track chunked tracking, Prisma upsert]
key_files:
  created: []
  modified:
    - app/api/sync/route.ts
    - lib/shipoffers.ts
decisions:
  - "Use native Response.json (not NextResponse) for Next.js 16 route handlers"
  - "fetchAllOrders and fetchAllShipments called in parallel via Promise.all"
  - "Shipment-to-order correlation via Map<order_id, ShipoffersShipment[]>"
  - "Mock adapters in lib/shipoffers.ts convert flat MockOrder to ShipoffersOrder shape with correct shipping_address structure"
  - "Mock fetchAllShipments generates ShipoffersShipment[] from orders that have tracking_code, enabling end-to-end mock flow"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-05-11"
---

# Phase 01 Plan 02: Sync Pipeline Rewrite Summary

**One-liner:** Full sync pipeline with parallel Shipoffers fetch, order_id-based shipment correlation, 17track status updates, and isDelayed computation written to Prisma DB.

## What Was Built

Rewrote `app/api/sync/route.ts` completely with a 3-stage pipeline:

**Stage 1 — Parallel fetch:** `Promise.all([fetchAllOrders(), fetchAllShipments()])` fetches both endpoints concurrently. Both functions handle mock fallback internally — no mock logic needed in the route.

**Stage 2 — Correlation and upsert:** Builds a `Map<number, ShipoffersShipment[]>` keyed by `shipment.order_id`. For each order, looks up its shipments, extracts `tracking_number` from first shipment (or null), parses `shipped_at` to Date, calculates `daysInTransit`, and upserts to Prisma with correct field mappings:
- `shipofffersId: String(order.id)` (triple-f typo kept as-is per schema)
- `customerName: order.shipping_address?.name`
- `customerEmail: order.email`
- `destinationCountry: order.shipping_address?.country`
- `shippedAt` from shipment (not order)
- `trackingCode: shipment.tracking_number`

**Stage 3 — 17track update:** Queries all undelivered orders with tracking codes, calls `trackPackages(codes)`, maps results back to orders, computes `isDelayed = status !== DELIVERED AND daysInTransit > delayThreshold`, writes `status`, `deliveredAt`, `lastTrackingSync`, `rawTrackingData`, `isDelayed`.

Also updated `lib/shipoffers.ts` mock adapters:
- `fetchAllOrders` mock now converts flat `MockOrder` fields to `ShipoffersOrder` shape (nested `shipping_address: { name, country }`)
- `fetchAllShipments` mock now generates `ShipoffersShipment[]` from orders that have `tracking_code`, enabling end-to-end mock flow with proper shipment-to-order correlation

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite sync route with orders + shipments + tracking pipeline | 166dd01 | app/api/sync/route.ts, lib/shipoffers.ts |

## Checkpoint Pending

| Task | Name | Status |
|------|------|--------|
| 2 | Verify sync pipeline in mock mode | Awaiting human verification |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Mock adapters needed for correct ShipoffersOrder shape**
- **Found during:** Task 1
- **Issue:** `lib/shipoffers.ts` mock fallback for `fetchAllOrders` returned `getMockOrders() as unknown as ShipoffersOrder[]`, which gave flat `MockOrder` fields at runtime. The sync route using `order.shipping_address?.name` would get `undefined` for all mock orders, and `fetchAllShipments` mock returned `[]` so no tracking codes would be correlated — making mock mode useless for verification.
- **Fix:** Added `mockOrdersToShipoffersOrders()` adapter that maps flat `MockOrder` fields to nested `ShipoffersOrder` shape. Added `mockShipmentsFromOrders()` that generates `ShipoffersShipment[]` from mock orders with tracking codes, keyed by numeric order_id derived from the `SO-XXXXX` string ID. Both mock functions now return data in the correct interface shape.
- **Files modified:** `lib/shipoffers.ts`
- **Commit:** 166dd01

## Known Stubs

- `SHIPOFFERS_API_USER=""` and `SHIPOFFERS_API_PASS=""` in `.env.local` — credentials pending from Ben Schulz. System falls back to mock data until credentials arrive (per D-10).

## Threat Surface Scan

No new security surface introduced. Verified against plan threat model:
- T-01-04: CRON_SECRET header check present in POST handler — `if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) return Response.json({ error: 'Unauthorized' }, { status: 401 })`
- T-01-06: Error responses return generic `{ error: 'Sync failed' }` to client; full error only in `console.error('[SYNC ERROR]', error)` server-side
- T-01-07: All DB writes via `prisma.order.upsert` and `prisma.order.update` — parameterized queries, no raw SQL

## Self-Check: PASSED

- FOUND: app/api/sync/route.ts
- FOUND: lib/shipoffers.ts
- FOUND: commit 166dd01
- tsc --noEmit: PASSED (0 errors)
- grep fetchAllShipments app/api/sync/route.ts: 2 matches
- grep fetchAllOrders app/api/sync/route.ts: 2 matches
- grep trackPackages app/api/sync/route.ts: 2 matches
- grep shipofffersId app/api/sync/route.ts: 2 matches
- grep order_id app/api/sync/route.ts: 3 matches
- grep shipping_address app/api/sync/route.ts: 5 matches
- grep tracking_number app/api/sync/route.ts: 1 match
- grep isDelayed app/api/sync/route.ts: 2 matches
- grep "tracking_code" app/api/sync/route.ts: 0 matches (old field — none present)
- grep "customer_name" app/api/sync/route.ts: 0 matches (old field — none present)
