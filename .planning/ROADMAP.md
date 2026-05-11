# Roadmap: Shipoffers Tracker

## Overview

The existing dashboard works in mock mode. The path to production is: fix the broken API integrations so real data flows in, add search/filter/pagination so the dashboard is usable at scale, add CSV export and threshold configuration for operational control, then prepare infrastructure for Vercel deploy with Postgres.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: API Integration Fix** - Connect to real Shipoffers and 17track APIs with correct auth and field mapping
- [ ] **Phase 2: Search, Filter & Pagination** - Make the orders table usable at scale with search, country filter, and pagination
- [ ] **Phase 3: Export & Configuration** - Add CSV export for delayed orders and UI to manage country delay thresholds
- [ ] **Phase 4: Production Infrastructure** - Migrate to Postgres, configure env vars, and prepare Vercel deploy

## Phase Details

### Phase 1: API Integration Fix
**Goal**: Real order and tracking data flows through the system instead of mock data
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04, API-05
**Success Criteria** (what must be TRUE):
  1. Dashboard displays real orders fetched from Shipoffers API (not mock data)
  2. Tracking codes from Shipoffers shipments are sent to 17track and status updates appear in the UI
  3. Sync button triggers a full cycle: fetch orders, fetch shipments, track packages -- all with real APIs
  4. Orders table shows correct customer name, tracking code, destination country, and status from real API responses
**Plans**: 2 plans

Plans:
**Wave 1**
- [x] 01-01-PLAN.md -- Rewrite Shipoffers API client with HTTP Basic Auth, correct /api/stores/{id}/*.json endpoints, mock fallback when credentials missing

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md -- Rewrite sync route to fetch orders + shipments, correlate tracking codes by order_id, map fields to Prisma, call 17track

### Phase 2: Search, Filter & Pagination
**Goal**: Users can quickly find specific orders in a growing dataset
**Depends on**: Phase 1
**Requirements**: SRCH-01, SRCH-02, SRCH-03, DATA-02
**Success Criteria** (what must be TRUE):
  1. User can type a tracking code and see only matching orders
  2. User can type a customer name and see only matching orders
  3. User can select a country from a dropdown and see only orders destined to that country
  4. Orders table shows paginated results with navigation controls (not all orders at once)
**Plans**: 2 plans

Plans:
**Wave 1**
- [ ] 02-01-PLAN.md -- Add search, country filter, and pagination to /api/orders endpoint (both mock and Prisma modes)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 02-02-PLAN.md -- Add search input, country dropdown, and pagination controls to dashboard UI

### Phase 3: Export & Configuration
**Goal**: Operators can extract delayed order data and adjust alerting behavior without code changes
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-03
**Success Criteria** (what must be TRUE):
  1. User can click a button to download a CSV file containing all currently delayed orders
  2. User can view current delay thresholds per country in a settings interface
  3. User can change a country's delay threshold and see it take effect on the next alert cycle
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Production Infrastructure
**Goal**: Application is ready to deploy on Vercel with a production database
**Depends on**: Phase 3
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. Prisma schema works with Vercel Postgres (migrations run cleanly)
  2. All environment variables (API keys, SMTP, CRON_SECRET, auth credentials) are documented and have production values
  3. Application boots and serves the dashboard when deployed to Vercel
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. API Integration Fix | 2/2 | Complete | 2026-05-11 |
| 2. Search, Filter & Pagination | 0/2 | Planning | - |
| 3. Export & Configuration | 0/0 | Not started | - |
| 4. Production Infrastructure | 0/0 | Not started | - |
