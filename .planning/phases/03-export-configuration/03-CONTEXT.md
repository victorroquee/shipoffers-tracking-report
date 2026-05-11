# Phase 3: Export & Configuration - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Add CSV export for delayed orders and a settings interface to manage country delay thresholds. Operators can extract data and adjust alerting behavior without code changes.

</domain>

<decisions>
## Implementation Decisions

### CSV Export
- **D-01:** "Exportar CSV" button placed near the orders table header, visible when delayed filter is active or always available.
- **D-02:** CSV contains: Order ID, Customer Name, Tracking Code, Country, Days in Transit, Threshold, Status, Shipped Date. Headers in pt-BR.
- **D-03:** Client-side CSV generation (no server endpoint needed) — construct from current filtered data displayed on the page. Simple and immediate.
- **D-04:** Filename: `pedidos-atrasados-YYYY-MM-DD.csv`

### Threshold Settings
- **D-05:** Settings accessible via a "Configuracoes" link in the sidebar or header navigation.
- **D-06:** Settings page at `/settings` route showing a table of all countries with their current delay thresholds.
- **D-07:** Thresholds currently hardcoded in `lib/delay-rules.ts`. Move to database (Prisma model) so they persist across deploys and can be edited via UI.
- **D-08:** New Prisma model `DelayThreshold` with fields: `countryCode` (unique), `countryName`, `days` (integer). Seed with current values from `DELAY_RULES`.
- **D-09:** Settings page shows editable number inputs per country. Save button persists changes via API.
- **D-10:** New API route `/api/settings/thresholds` — GET returns all thresholds, PUT updates individual threshold.
- **D-11:** `lib/delay-rules.ts` `getDelayThreshold()` reads from database first, falls back to hardcoded defaults if DB is unavailable.

### Claude's Discretion
- Exact CSV column formatting and delimiter (comma vs semicolon)
- Settings page visual design (table layout, input styling)
- Whether to add confirmation dialog before saving threshold changes
- Seed script approach for initial threshold data

</decisions>

<canonical_refs>
## Canonical References

### Source Files
- `lib/delay-rules.ts` — Current hardcoded thresholds (source of seed data)
- `prisma/schema.prisma` — Database schema (needs new DelayThreshold model)
- `app/page.tsx` — Dashboard (add CSV export button)
- `components/Sidebar.tsx` — Navigation (add settings link)

### Requirements
- `.planning/REQUIREMENTS.md` — DATA-01, DATA-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/delay-rules.ts`: Has the threshold values to seed the database
- `lib/db.ts`: Prisma client instance
- `components/Sidebar.tsx`: Navigation sidebar — add settings link

### Established Patterns
- API routes in `app/api/` with NextResponse
- Prisma for database operations
- Inline CSS consistent with other components
- pt-BR labels

### Integration Points
- `getDelayThreshold()` called from sync route — needs to read from DB instead of hardcoded
- Dashboard page needs CSV export button
- Navigation needs settings link

</code_context>

<specifics>
## Specific Ideas

- The DELAY_RULES object has 20 countries with thresholds ranging from 7 to 21 days — all should be seeded
- CSV export should work in both mock and production modes

</specifics>

<deferred>
## Deferred Ideas

- Email alert configuration UI — could be Phase 4 or future
- Bulk threshold import/export — future enhancement
- Threshold change history/audit log — future enhancement

</deferred>

---

*Phase: 03-Export & Configuration*
*Context gathered: 2026-05-11 via autonomous smart discuss*
