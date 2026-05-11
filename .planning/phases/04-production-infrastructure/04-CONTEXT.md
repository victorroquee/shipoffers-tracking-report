# Phase 4: Production Infrastructure - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous — infrastructure phase)

<domain>
## Phase Boundary

Prepare the application for production deployment on Vercel with Vercel Postgres. Migrate from SQLite to Postgres, document all environment variables, and ensure the app boots and serves the dashboard in production.

</domain>

<decisions>
## Implementation Decisions

### Database Migration
- **D-01:** Switch Prisma provider from `sqlite` to `postgresql`. Use Vercel Postgres connection string via `DATABASE_URL` env var.
- **D-02:** Keep SQLite for local dev (`DATABASE_URL="file:./dev.db"` in `.env.local`). Prisma handles both providers via env var.
- **D-03:** Run `prisma migrate dev` to create initial migration from current schema. This replaces `db push` for production.

### Environment Variables Documentation
- **D-04:** Create `.env.example` documenting ALL required env vars with placeholder values and descriptions.
- **D-05:** Required vars: `DATABASE_URL`, `SHIPOFFERS_API_USER`, `SHIPOFFERS_API_PASS`, `SHIPOFFERS_STORE_ID`, `SEVENTEENTRACK_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ALERT_FROM`, `ALERT_TO_SHIPOFFERS`, `DASHBOARD_USER`, `DASHBOARD_PASS`, `CRON_SECRET`, `USE_MOCK`.
- **D-06:** Shipoffers API credentials still pending from Ben Schulz — document as required but leave deployment possible with USE_MOCK=true.

### Vercel Configuration
- **D-07:** `vercel.json` with cron configuration for sync jobs. Vercel Pro required for multiple crons.
- **D-08:** Ensure `next.config.js` is compatible with Vercel edge functions if needed.

### Claude's Discretion
- Prisma migration naming conventions
- Whether to add health check endpoint
- Vercel-specific build configuration details
- Whether to add a deploy checklist/README section

</decisions>

<canonical_refs>
## Canonical References

- `prisma/schema.prisma` — Current schema (sqlite provider, needs postgresql)
- `.env.local` — Current local env vars
- `vercel.json` — Vercel config (if exists)
- `next.config.js` or `next.config.ts` — Next.js config
- `.planning/REQUIREMENTS.md` — INFRA-01, INFRA-02, INFRA-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Key Files
- `prisma/schema.prisma`: Current schema with Order, OrderEvent, DelayThreshold models
- `lib/db.ts`: Prisma client singleton
- `prisma/seed-thresholds.ts`: Threshold seeding script

### Integration Points
- All API routes use `prisma` from `lib/db.ts`
- Cron jobs defined (sync, alerts)
- SMTP configured in `lib/mailer.ts`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase following standard Vercel + Prisma + Postgres patterns.

</specifics>

<deferred>
## Deferred Ideas

None — this is the final phase of the milestone.

</deferred>

---

*Phase: 04-Production Infrastructure*
*Context gathered: 2026-05-11 via autonomous smart discuss*
