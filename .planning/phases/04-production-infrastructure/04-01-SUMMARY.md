---
phase: 04-production-infrastructure
plan: "01"
subsystem: database
tags: [prisma, postgresql, sqlite, dual-adapter, migration]
dependency_graph:
  requires: []
  provides: [dual-adapter-prisma-client, postgres-migration-sql]
  affects: [lib/db.ts, prisma/schema.prisma, all-api-routes]
tech_stack:
  added: ["@prisma/adapter-pg", "pg", "@types/pg"]
  patterns: ["conditional-adapter-selection", "DATABASE_URL-prefix-detection"]
key_files:
  created: ["prisma/migrations/0001_init/migration.sql"]
  modified: ["prisma/schema.prisma", "lib/db.ts", "package.json"]
decisions:
  - "Use require() for conditional adapter loading to avoid importing both at module init"
  - "Keep @prisma/adapter-better-sqlite3 in dependencies — local dev still uses SQLite (D-02)"
  - "DATABASE_URL prefix detection: postgres:// or postgresql:// -> pg, else -> sqlite"
  - "Used prisma migrate diff --from-empty --to-schema (Prisma 7 flag, not --to-schema-datamodel)"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-11"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 4 Plan 01: Dual-Mode Prisma (SQLite/PostgreSQL) Summary

Migrated Prisma from SQLite-only to dual-mode: PostgreSQL for production (Vercel Postgres) and SQLite for local development, with DATABASE_URL-based adapter selection at runtime.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install pg adapter and switch schema to postgresql | fa3fb75 | package.json, package-lock.json, prisma/schema.prisma |
| 2 | Update lib/db.ts for dual-adapter mode and create migration | 0a7ad94 | lib/db.ts, prisma/migrations/0001_init/migration.sql |

## What Was Built

- **prisma/schema.prisma**: Changed `provider = "sqlite"` to `provider = "postgresql"`. All model field types (String, Int, Boolean, DateTime, cuid(), now(), @updatedAt) are PostgreSQL-compatible without modification.

- **lib/db.ts**: Rewrote to detect DATABASE_URL prefix and select the correct Prisma adapter:
  - `postgres://` or `postgresql://` prefix → `@prisma/adapter-pg` (Pool + PrismaPg)
  - `file:` prefix or absent → `@prisma/adapter-better-sqlite3` (PrismaBetterSqlite3)
  - Adapter modules loaded via `require()` inside the conditional branch to avoid loading both at init
  - DATABASE_URL value is never logged (mitigates T-04-01 credential exposure)
  - Preserves the globalForPrisma singleton caching pattern for dev hot-reload

- **prisma/migrations/0001_init/migration.sql**: Initial PostgreSQL migration generated with `prisma migrate diff --from-empty --to-schema`. Covers `Order`, `OrderEvent` tables with all constraints, indexes, and foreign keys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma 7 changed CLI flag for migrate diff**
- **Found during:** Task 2
- **Issue:** Plan specified `--to-schema-datamodel` but Prisma 7 removed this flag
- **Fix:** Used `--to-schema` instead (the new Prisma 7 equivalent)
- **Files modified:** None (CLI usage only)
- **Commit:** 0a7ad94

## Known Stubs

None — all data flows are wired. The dual-adapter selection is fully functional for both SQLite local and PostgreSQL production paths.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced beyond what was planned.

## Threat Model Coverage

- **T-04-01 (I - Information Disclosure):** Mitigated. DATABASE_URL is never passed to `console.log()` or any logging call in lib/db.ts. The pg Pool receives the connection string internally; no credential is exposed to application logs or client-side code.
- **T-04-02 (T - Tampering):** Accepted. Migration file is committed to git — tampering is detectable via git history. Vercel deploys from trusted repo.

## Self-Check: PASSED

- [x] `prisma/schema.prisma` exists with `provider = "postgresql"` — FOUND
- [x] `lib/db.ts` references `adapter-pg` and `adapter-better-sqlite3` — FOUND
- [x] `prisma/migrations/0001_init/migration.sql` exists — FOUND
- [x] Commits fa3fb75 and 0a7ad94 exist in git log — FOUND
- [x] `npm run build` succeeded with 0 errors
