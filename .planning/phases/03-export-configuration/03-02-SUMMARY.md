---
phase: "03-export-configuration"
plan: "02"
subsystem: "export-and-configuration-ui"
tags: ["csv-export", "settings-page", "sidebar", "ui", "threshold-editor"]

dependency_graph:
  requires:
    - "03-01 — DelayThreshold model + GET/PUT /api/settings/thresholds"
  provides:
    - "CSV export button on dashboard (Exportar CSV)"
    - "Settings page at /settings with editable thresholds table"
    - "Sidebar Configuracoes link pointing to /settings"
  affects:
    - "app/page.tsx — exportCSV() function + Download button in filter bar"
    - "components/Sidebar.tsx — Settings icon + Sistema section with /settings link"
    - "app/settings/page.tsx — new client component for threshold management"

tech_stack:
  added: []
  patterns:
    - "Client-side CSV generation via Blob + URL.createObjectURL + anchor click"
    - "UTF-8 BOM prefix (\\uFEFF) for Excel pt-BR compatibility"
    - "Per-row save with 2s auto-dismiss success feedback"
    - "Controlled number inputs with original/current diff tracking"

key_files:
  created:
    - path: "app/settings/page.tsx"
      role: "Threshold management page — fetches all thresholds, editable table, per-row PUT save"
  modified:
    - path: "app/page.tsx"
      role: "Added exportCSV() function and Exportar CSV button in filter bar"
    - path: "components/Sidebar.tsx"
      role: "Added Settings icon, configItems array, Sistema nav section with /settings link"

decisions:
  - "exportCSV fetches all delayed orders (per_page=9999) when filter==='delayed' so export is not limited to current page; falls back to current page data for other filters"
  - "CSV uses UTF-8 BOM (\\uFEFF) so Excel opens pt-BR data correctly without encoding issues"
  - "Per-row save button: appears only when value differs from fetched original, giving clear change indication without a global Save All button"
  - "Settings page has its own standalone header with back arrow link — does not reuse Sidebar layout to keep it simple and self-contained"
  - "Input validation: type=number min=1 max=365 on client mirrors server-side validation (T-03-06)"

metrics:
  duration_minutes: 15
  completed_date: "2026-05-11"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 03 Plan 02: Export & Configuration UI Summary

**One-liner:** CSV export button on dashboard with pt-BR headers/BOM, threshold editor at /settings fetching DB-backed thresholds via API, and Settings nav link in sidebar.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | CSV export + settings page + sidebar link | e81c513 | app/page.tsx, app/settings/page.tsx, components/Sidebar.tsx |

## Task 2: Awaiting Checkpoint

Task 2 is a `checkpoint:human-verify` — visual verification pending user review.

## What Was Built

### CSV Export (app/page.tsx — Task 1)

Added `exportCSV()` function and `Download` icon import. The button appears in the status filter bar on the right side with a green accent color.

Export logic:
- If `filter === 'delayed'`: fetches all delayed orders via `?filter=delayed&per_page=9999` (plus active search/country filters) so the export is not page-limited
- Otherwise: uses current `orders` state (current page data)
- Builds CSV with pt-BR headers: `ID Pedido,Nome Cliente,Codigo Rastreio,Pais,Dias em Transito,Threshold,Status,Data Envio`
- UTF-8 BOM (`\uFEFF`) prefix for Excel pt-BR compatibility
- Dates formatted as DD/MM/YYYY
- Values with commas/quotes are escaped per RFC 4180
- Filename: `pedidos-atrasados-YYYY-MM-DD.csv` using current date

### Settings Page (app/settings/page.tsx — Task 1)

Client component (`'use client'`) at `/settings`. On mount fetches `GET /api/settings/thresholds` and tracks each row's `current`/`original` days in local state.

UI:
- Standalone page with sticky header containing back arrow and Settings icon
- White card table with columns: Pais (countryName), Codigo (countryCode badge), Dias para Alerta (number input), Acao
- Number inputs: `type="number" min={1} max={365}` (T-03-06 mitigation), border turns accent green when changed
- Per-row Salvar button appears only when value differs from original
- On save: PUT `/api/settings/thresholds` with `{ countryCode, days }`, shows "Salvo!" with check icon for 2s, then resets
- Error handling: red error text inline in row if PUT fails

### Sidebar Update (components/Sidebar.tsx — Task 1)

- Added `Settings` to lucide-react import
- Added `configItems` array with `{ href: '/settings', label: 'Configuracoes', icon: Settings }`
- New "Sistema" section below "Monitoramento" section — same visual style (uppercase 10px section label, active state styling)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All data flows from real API endpoints backed by the DB (from plan 03-01).

## Threat Flags

No new threat surface beyond the plan's threat model.

| Mitigated | Threat | Implementation |
|-----------|--------|----------------|
| T-03-06 | Tampering via settings number inputs | Client: type=number min=1 max=365; Server: PUT handler validates 1-365 (plan 03-01) |

## Self-Check: PASSED

- app/page.tsx contains "Exportar CSV" — FOUND (grep count: 1)
- app/page.tsx contains `pedidos-atrasados-${dateStr}.csv` — FOUND
- app/page.tsx contains `new Blob` with `text/csv` — FOUND
- app/settings/page.tsx exists — FOUND
- app/settings/page.tsx fetches `/api/settings/thresholds` — FOUND (2 occurrences: GET + PUT)
- components/Sidebar.tsx contains "Configuracoes" — FOUND
- components/Sidebar.tsx contains `/settings` href — FOUND
- Commit e81c513 exists — FOUND
- `npx tsc --noEmit` passed with zero errors — CONFIRMED
