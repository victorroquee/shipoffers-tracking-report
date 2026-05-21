@AGENTS.md

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Shipoffers Tracker**

Dashboard de rastreamento de pedidos internacionais para OG Group. Monitora envios via Shipoffers, rastreia pacotes com 17track, e envia alertas por email quando entregas excedem thresholds de atraso por pais. Acompanha 100-500 pedidos simultaneamente com cron jobs automatizados na Vercel.

**Core Value:** Visibilidade em tempo real sobre pedidos atrasados com alertas automaticos — se um pacote excede o threshold do pais, o time e notificado antes que o cliente reclame.

### Constraints

- **Tech stack**: Next.js 16 + Prisma 7 + Tailwind — ja implementado, nao mudar
- **Database**: SQLite para dev, Vercel Postgres para producao
- **Vercel Pro**: Necessario para multiplos cron jobs
- **17track rate limit**: Max 40 codigos por request (ja implementado com chunking)
- **17track credit budget**: Controlado em `lib/constants.ts` (CREDIT_BUDGET + TRACK_LIMIT)
- **Shipoffers API**: Requer `store_id` em todas as rotas
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Runtime**: Next.js 16.2 (App Router, Turbopack)
- **Language**: TypeScript (strict mode, ES2017 target)
- **ORM**: Prisma 7 com adapter pattern (better-sqlite3 dev / pg prod)
- **Styling**: Tailwind CSS 4 via PostCSS + inline styles
- **HTTP**: Axios para APIs externas
- **Email**: Nodemailer (SMTP)
- **Icons**: Lucide React (strokeWidth 1.4)
- **Auth**: HTTP Basic Auth via `proxy.ts` (convencao Next.js 16)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Status constants**: Definidos em `lib/constants.ts` (TrackingStatus type + STATUS_RANK)
- **Cores**: Design tokens em `lib/constants.ts` (COLORS object) e `globals.css` (CSS vars)
- **Filtro de data**: Usar `buildDateWhere()` de `lib/date-filter.ts` em queries Prisma
- **Credit limits**: Nunca hardcode — usar CREDIT_BUDGET e TRACK_LIMIT de `lib/constants.ts`
- **API routes**: POST protegidas por `x-cron-secret`, GET publicas (atras do Basic Auth)
- **Mock mode**: `USE_MOCK=true` ou credenciais ausentes = fallback automatico para dados mock
- **Componentes**: PascalCase, default export, inline styles com design tokens
- **Idioma UI**: Portugues brasileiro (labels, mensagens, datas formatadas pt-BR)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

```
[Shipoffers API] → /api/sync → [Prisma DB] ← /api/orders → [Dashboard]
[17track API]    → /api/track → [Prisma DB] ← /api/metrics → [StatsBar]
                   /api/alerts → [Nodemailer] → [Email team]
```

- **Sync pipeline**: Shipoffers fetch → DB upsert → 17track register → 17track track
- **Date filtering**: `shippedAt` para enviados, `createdAt` fallback para pendentes
- **Status ranking**: Nunca downgrade (IN_TRANSIT nao volta para UNKNOWN)
- **Proxy auth**: `proxy.ts` na raiz = middleware HTTP Basic Auth (Next.js 16)
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
