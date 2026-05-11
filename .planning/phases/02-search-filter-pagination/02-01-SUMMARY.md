---
phase: 02-search-filter-pagination
plan: "01"
subsystem: api
tags: [search, filter, pagination, orders-api, mock-mode]
dependency_graph:
  requires: []
  provides: [orders-api-paginated, orders-api-search, orders-api-country-filter, orders-countries-endpoint]
  affects: [components/orders-table]
tech_stack:
  added: []
  patterns: [prisma-and-filter, in-memory-filter, server-side-pagination]
key_files:
  created: []
  modified:
    - app/api/orders/route.ts
    - lib/mock-data.ts
decisions:
  - "Used AND composition for all filter clauses to allow simultaneous search+country+status filtering"
  - "Countries list added as ?countries=true query param on same route rather than separate endpoint"
  - "per_page capped at 100 to prevent memory exhaustion (T-02-02)"
  - "SQLite LIKE is case-insensitive for ASCII — Prisma contains without mode:insensitive works correctly"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-11T13:05:30Z"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
---

# Phase 02 Plan 01: Search, Country Filter, and Pagination — API Layer Summary

**One-liner:** Server-side search (trackingCode/customerName), country filter, status filter, and pagination added to GET /api/orders with composable AND logic; both mock and Prisma modes return `{ orders, total, page, per_page, total_pages }`.

## What Was Built

The `/api/orders` GET handler was rewritten to accept five new query parameters while preserving backward compatibility with the existing `filter` param:

- `search` — case-insensitive substring match on `customerName` OR `trackingCode`
- `country` — exact match on `destinationCountry`
- `filter` — existing delayed/delivered status filter (preserved)
- `page` — 1-indexed page number (default 1)
- `per_page` — items per page, default 25, capped at 100

The response shape changed from a flat array to an object:
```json
{ "orders": [...], "total": 30, "page": 1, "per_page": 25, "total_pages": 2 }
```

A `?countries=true` query param returns `{ "countries": ["AT","BE","BR",...] }` — sorted distinct destination countries from the dataset.

`lib/mock-data.ts` gained a new exported helper `getDistinctMockCountries()` returning sorted unique country codes from `MOCK_ORDERS`.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add search, country filter, and pagination to /api/orders | daa28c4 | app/api/orders/route.ts, lib/mock-data.ts |

## Security Mitigations Applied (Threat Model)

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-02-01 (Tampering) | page/per_page parsed with parseInt + Math.max/min guards; search/country passed as Prisma parameterized values | Applied |
| T-02-02 (DoS) | per_page capped at 100 via Math.min(100, ...) | Applied |
| T-02-03 (Info Disclosure) | Existing pattern preserved: generic error to client, full error to console.error | Accepted |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- app/api/orders/route.ts exists: FOUND (125 lines, updated from 42)
- lib/mock-data.ts updated with getDistinctMockCountries: FOUND
- Commit daa28c4 exists: FOUND
- tsc --noEmit: PASSED (zero errors)
