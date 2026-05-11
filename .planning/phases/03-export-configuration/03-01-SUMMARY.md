---
phase: "03-export-configuration"
plan: "01"
subsystem: "threshold-management-backend"
tags: ["prisma", "api", "delay-thresholds", "database"]

dependency_graph:
  requires: []
  provides:
    - "DelayThreshold Prisma model with 20 seeded countries"
    - "GET /api/settings/thresholds — returns all thresholds as JSON array"
    - "PUT /api/settings/thresholds — updates single threshold by countryCode"
    - "async getDelayThreshold() — reads DB first, falls back to hardcoded values"
    - "getDelayThresholdSync() — backward-compatible sync fallback for mock-data.ts"
  affects:
    - "lib/mock-data.ts — updated to use getDelayThresholdSync"
    - "app/api/sync/route.ts — updated to await async getDelayThreshold"

tech_stack:
  added: []
  patterns:
    - "Prisma upsert for idempotent seeding"
    - "DB-first lookup with hardcoded fallback pattern"
    - "Sync/async split export for gradual migration of callers"

key_files:
  created:
    - path: "prisma/seed-thresholds.ts"
      role: "Idempotent seed script — populates DelayThreshold table from DELAY_RULES values"
    - path: "app/api/settings/thresholds/route.ts"
      role: "Threshold CRUD API — GET lists all, PUT updates one with input validation"
  modified:
    - path: "prisma/schema.prisma"
      role: "Added DelayThreshold model with countryCode @unique, countryName, days, updatedAt"
    - path: "lib/delay-rules.ts"
      role: "getDelayThreshold made async (DB-first), added getDelayThresholdSync for compat"
    - path: "app/api/sync/route.ts"
      role: "Updated to await async getDelayThreshold()"
    - path: "lib/mock-data.ts"
      role: "Updated import to use getDelayThresholdSync()"

decisions:
  - "Used getDelayThresholdSync export to avoid breaking mock-data.ts which runs in sync context; app/api/sync/route.ts is async so it uses the DB-first version"
  - "Seed script lives in prisma/seed-thresholds.ts and uses upsert for idempotency"
  - "Mock mode for PUT returns 501 (Not Implemented) rather than silently succeeding"
  - "Input validation on PUT enforces days as integer in 1-365 range before DB operation (T-03-01)"

metrics:
  duration_minutes: 12
  completed_date: "2026-05-11"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 4
---

# Phase 03 Plan 01: Threshold Management Backend Summary

**One-liner:** Prisma DelayThreshold model + seeded with 20 countries, REST API (GET/PUT) with validation, and DB-first getDelayThreshold() with hardcoded fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add DelayThreshold model and seed | ea01e6c | prisma/schema.prisma, prisma/seed-thresholds.ts |
| 2 | Create threshold API route and update getDelayThreshold | 7a37561 | app/api/settings/thresholds/route.ts, lib/delay-rules.ts, app/api/sync/route.ts, lib/mock-data.ts |

## What Was Built

### DelayThreshold Prisma Model (Task 1)

Added to `prisma/schema.prisma` after the OrderEvent model:

```prisma
model DelayThreshold {
  id          String   @id @default(cuid())
  countryCode String   @unique
  countryName String
  days        Int
  updatedAt   DateTime @updatedAt
}
```

Applied via `npx prisma db push` and regenerated the Prisma client. Created `prisma/seed-thresholds.ts` which uses `upsert` for idempotency — safe to re-run. Seeded all 20 countries from DELAY_RULES (excludes DEFAULT which is a fallback, not a country). Database confirmed 20 rows.

### Threshold API Route (Task 2)

`app/api/settings/thresholds/route.ts`:
- **GET**: Returns `prisma.delayThreshold.findMany({ orderBy: { countryName: 'asc' } })`. Mock mode returns static array.
- **PUT**: Validates `countryCode` (string, must exist in DB) and `days` (integer, 1-365). Returns 400 for invalid input, 404 for unknown country, 501 in mock mode. Uses `prisma.delayThreshold.update`.

### Updated getDelayThreshold (Task 2)

`lib/delay-rules.ts` now exports two functions:
- `getDelayThreshold(code)` — **async**, tries DB first, catches any error and falls back to DELAY_RULES
- `getDelayThresholdSync(code)` — **sync**, reads only hardcoded DELAY_RULES (backward compat)

Updated callers:
- `app/api/sync/route.ts` — awaits `getDelayThreshold()` (async context, gets DB-accurate values)
- `lib/mock-data.ts` — uses `getDelayThresholdSync()` (sync context, mock data generation)

## Verification Results

All checks passed:
- `prisma/schema.prisma` contains `model DelayThreshold` with `countryCode @unique`
- `prisma.delayThreshold.count()` returns 20
- GET and PUT handlers exported from API route
- `getDelayThreshold` is async with `prisma.delayThreshold.findUnique`
- `getDelayThresholdSync` exported for sync callers
- `npx tsc --noEmit` passes with zero errors

## Deviations from Plan

None — plan executed exactly as written. Sync/async split was explicitly specified in the plan ("Also export a synchronous getDelayThresholdSync()...").

## Known Stubs

None. All functionality is wired to the real database.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model.

| Mitigated | Threat | Implementation |
|-----------|--------|----------------|
| T-03-01 | PUT input tampering | days validated as integer 1-365; countryCode checked against DB before update |

## Self-Check: PASSED

- `prisma/schema.prisma` exists and contains `model DelayThreshold` — FOUND
- `app/api/settings/thresholds/route.ts` exists and exports GET, PUT — FOUND
- `lib/delay-rules.ts` exports async `getDelayThreshold` and sync `getDelayThresholdSync` — FOUND
- Commit ea01e6c exists — FOUND
- Commit 7a37561 exists — FOUND
- DB has 20 DelayThreshold rows — CONFIRMED
- `tsc --noEmit` passes — CONFIRMED
