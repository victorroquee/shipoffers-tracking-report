# Phase 2: Search, Filter & Pagination - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Add search by tracking code/customer name, country dropdown filter, and pagination to the orders table. Users can quickly find specific orders in a growing dataset (100-500 orders).

</domain>

<decisions>
## Implementation Decisions

### Search Behavior
- **D-01:** Single search input at top of orders table. Searches both tracking code AND customer name simultaneously (no toggle needed — just type and results filter).
- **D-02:** Search is client-side for mock mode, server-side (API query param) for production. The `/api/orders` route already accepts query params.
- **D-03:** Debounce search input at 300ms to avoid excessive API calls.
- **D-04:** Show "Nenhum pedido encontrado" empty state when search/filter returns no results.

### Country Filter
- **D-05:** Country dropdown populated from distinct `destinationCountry` values in the orders dataset. No hardcoded country list.
- **D-06:** Dropdown sits next to the search input in a horizontal filter bar. Existing status filters (Todos/Em Atraso/Entregues) remain — country filter is additive.
- **D-07:** Filters compose: search + country + status all apply simultaneously.

### Pagination
- **D-08:** Server-side pagination with page size of 25 orders per page.
- **D-09:** Navigation controls: Previous/Next buttons + page indicator "Pagina X de Y". No page number buttons needed for 100-500 orders.
- **D-10:** Pagination resets to page 1 when search or filter changes.

### Visual Design
- **D-11:** Keep existing inline CSS approach used by OrdersTable.tsx and page.tsx — no CSS framework change.
- **D-12:** Filter bar matches existing dark header (#111418) aesthetic with light content area (#F0F2F5).
- **D-13:** UI language stays pt-BR consistent with existing labels (Todos, Em Atraso, Entregues).

### Claude's Discretion
- Exact placement and sizing of search input and country dropdown
- Whether to show total count next to pagination ("Mostrando 1-25 de 127 pedidos")
- Animation/transition when results change
- Keyboard shortcut for focusing search input

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI Components
- `components/OrdersTable.tsx` — Current orders table (inline CSS, expandable rows, status badges)
- `components/StatsBar.tsx` — Stats cards above the table
- `components/StatusBadge.tsx` — Status badge component
- `app/page.tsx` — Main dashboard page with existing filter logic (all/delayed/delivered)

### API
- `app/api/orders/route.ts` — Orders API endpoint (needs search/pagination params)
- `lib/db.ts` — Prisma client
- `lib/mock-data.ts` — Mock data for dev mode

### Data Model
- `prisma/schema.prisma` — Order model with fields: trackingCode, customerName, destinationCountry

### Requirements
- `.planning/REQUIREMENTS.md` — SRCH-01, SRCH-02, SRCH-03, DATA-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/OrdersTable.tsx`: Full table with sorting, expandable rows — needs search/filter integration
- `components/StatsBar.tsx`: Stats cards — no changes needed
- `components/SyncButton.tsx`: Sync trigger — no changes needed
- `components/StatusBadge.tsx`: Status badge — reusable as-is

### Established Patterns
- Inline CSS with React.CSSProperties objects (th, td styles in OrdersTable)
- Client-side state with useState + useCallback + useEffect pattern
- fetch() to /api/orders with query params for filtering
- Lucide React icons for UI elements
- pt-BR labels throughout the UI

### Integration Points
- `app/page.tsx` manages orders state and passes to OrdersTable — search/filter/pagination state goes here
- `/api/orders` route needs new query params: `search`, `country`, `page`, `per_page`
- OrdersTable receives orders array as prop — pagination controls rendered below table

</code_context>

<specifics>
## Specific Ideas

- Existing filter buttons (Todos/Em Atraso/Entregues) should be preserved and compose with new search/country/pagination
- The orders API already has a mock mode that returns mock data — search/filter should work in both modes

</specifics>

<deferred>
## Deferred Ideas

- CSV export — Phase 3
- Delay threshold configuration — Phase 3
- Advanced sorting (click column headers) — could be a future enhancement

</deferred>

---

*Phase: 02-Search, Filter & Pagination*
*Context gathered: 2026-05-11 via autonomous smart discuss*
