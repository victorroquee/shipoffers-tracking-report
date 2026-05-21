# Shipoffers Tracker — OG Group

Dashboard de rastreamento de pedidos internacionais. Monitora envios via Shipoffers, rastreia pacotes com 17track, e envia alertas por email quando entregas excedem thresholds de atraso por pais.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: Prisma 7 — SQLite (dev) / Vercel Postgres (prod)
- **Styling**: Tailwind CSS 4 + inline styles (design system OG Group)
- **APIs**: Shipoffers (pedidos), 17track (rastreamento), Nodemailer (alertas)
- **Deploy**: Vercel Pro (cron jobs automatizados)

## Desenvolvimento local

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Acesse `http://localhost:3000` (login: credenciais em `.env.local`).

Copie `.env.example` para `.env.local` e configure. Com `USE_MOCK=true` o dashboard roda com dados simulados.

## Estrutura do projeto

```
app/
  page.tsx                    # Dashboard principal
  metrics/page.tsx            # Painel de metricas
  settings/page.tsx           # Configuracao de thresholds
  api/
    orders/route.ts           # GET — lista pedidos com filtros e paginacao
    sync/route.ts             # POST — sync Shipoffers + register/track 17track
    track/route.ts            # POST — atualiza tracking de pedidos pendentes
    alerts/route.ts           # POST — envia emails de alerta de atraso
    metrics/route.ts          # GET — metricas agregadas
    health/route.ts           # GET — health check
    settings/thresholds/      # GET/PUT — thresholds de atraso por pais

components/
  OrdersTable.tsx             # Tabela expandivel com detalhes
  StatsBar.tsx                # 6 KPI cards
  DateRangeSelector.tsx       # Seletor de periodo (hoje, 7d, mes, personalizado)
  StatusBadge.tsx             # Badges de status coloridos
  SyncButton.tsx              # Botao de sync manual com cooldown
  MetricsPanel.tsx            # Painel de metricas com grafico por pais

lib/
  constants.ts                # Status, cores, limites de credito (source of truth)
  date-filter.ts              # Filtro de data compartilhado para Prisma
  db.ts                       # Prisma client factory (SQLite/Postgres)
  shipoffers.ts               # API client Shipoffers
  tracking.ts                 # API client 17track
  delay-rules.ts              # Thresholds de atraso por pais
  mailer.ts                   # Template e envio de email de alerta
  mock-data.ts                # 30 pedidos mock para desenvolvimento
```

## Status de pedidos

| Status | Label | Descricao |
|--------|-------|-----------|
| `PENDING` | Aguardando Envio | Pedido sem tracking/envio |
| `IN_TRANSIT` | Em Transito | Enviado, aguardando entrega |
| `OUT_FOR_DELIVERY` | Saiu p/ Entrega | Em rota de entrega |
| `DELIVERED` | Entregue | Entregue ao destinatario |
| `EXCEPTION` | Excecao | Problema na entrega |
| `UNKNOWN` | Desconhecido | Status nao identificado |

## Cron jobs (Vercel)

| Job | Horario (UTC) | Descricao |
|-----|---------------|-----------|
| `/api/sync` | 08:00 | Busca pedidos + registra/rastreia no 17track |
| `/api/track` | 12:00 | Atualiza tracking de pedidos pendentes |
| `/api/alerts` | 13:00 | Envia emails para pedidos atrasados |

## Creditos 17track

O budget de creditos e controlado em `lib/constants.ts`:
- `CREDIT_BUDGET` — creditos por sync (register + track)
- `TRACK_LIMIT` — creditos por chamada standalone de track
