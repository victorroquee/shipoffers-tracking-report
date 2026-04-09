# Shipoffers Tracker — Registro de Implementações

> Documento de handoff para próxima sessão de desenvolvimento.
> Projeto: rastreamento de pedidos Shipoffers com alertas de atraso — OG Group.

---

## O que foi implementado

### Infraestrutura e Setup
- Next.js 16 com App Router, TypeScript, Tailwind CSS
- Prisma 7 com adapter `better-sqlite3` para desenvolvimento local (SQLite)
- `prisma.config.ts` configurado (Prisma 7 não usa `url` no `schema.prisma`)
- `proxy.ts` no lugar de `middleware.ts` (convenção renomeada no Next.js 16)
- HTTP Basic Auth protegendo o dashboard via `proxy.ts`
- `USE_MOCK=true` no `.env.local` para rodar sem APIs reais

### Banco de dados (`prisma/schema.prisma`)
- Model `Order` — todos os campos: id, shipofffersId, trackingCode, customerName, customerEmail, destinationCountry, shippedAt, deliveredAt, status, daysInTransit, delayThreshold, isDelayed, alertSentAt, lastTrackingSync, rawTrackingData
- Model `OrderEvent` — histórico seletivo (criado apenas quando pedido está atrasado)
- Migration rodada localmente com `dev.db` SQLite

### Bibliotecas instaladas
- `prisma`, `@prisma/client`, `@prisma/adapter-better-sqlite3`, `better-sqlite3`
- `axios` — requisições HTTP para APIs externas
- `nodemailer`, `@types/nodemailer` — envio de emails SMTP
- `lucide-react` — ícones (strokeWidth 1.4 em toda a UI)

### Camada de serviços (`lib/`)
- `lib/db.ts` — singleton PrismaClient com adapter better-sqlite3
- `lib/delay-rules.ts` — thresholds de atraso por país (DE=7d, FR=10d, IT=12d, BR=21d, etc.)
- `lib/shipoffers.ts` — integração com API Shipoffers (paginada, 100/req)
- `lib/tracking.ts` — integração com 17track API (chunks de 40 códigos)
- `lib/mailer.ts` — email HTML de alerta com tabela de pedidos atrasados
- `lib/mock-data.ts` — 30 pedidos mock para desenvolvimento (toggle `USE_MOCK=true`)

### API Routes (`app/api/`)
- `POST /api/sync` — puxa pedidos da Shipoffers, faz upsert no banco, calcula daysInTransit e delayThreshold por país
- `POST /api/track` — atualiza status de rastreamento via 17track para pedidos não entregues
- `POST /api/alerts` — envia email de alerta para pedidos atrasados (debounce 24h por pedido)
- `GET /api/orders` — lista pedidos com filtros (all / delayed / delivered), inclui eventos se filtro=delayed
- `GET /api/metrics` — agrega métricas: taxa de entrega, tempo médio, média por país
- Todas as rotas POST protegidas por `x-cron-secret` header

### Automação (`vercel.json`)
```
Sync     → 11:00 UTC (08:00 BRT)
Track    → 11:00 e 23:00 UTC (08:00 e 20:00 BRT)
Alerts   → 11:30 e 23:30 UTC (08:30 e 20:30 BRT)
```

### Frontend — Design System OG Group v1.1
- Header dark `#111418` com logo OG Group PNG + badge "Tracker" lime
- Indicador "Sistema Ativo" (ponto verde pulsante) no header
- KPI cards brancos com ícones coloridos e deltas semânticos
- Tabela de pedidos com **expand por clique** — mostra todos os detalhes do envio
- Painel expandido: email do cliente, data de entrega, última sincronização, histórico de eventos
- Badge "Email Enviado" (verde) e "Aguardando" (amarelo) visíveis na tabela
- Filtros: Todos / Em Atraso / Entregues
- Botão Sync Manual com cooldown 30s
- Página `/metrics` com KPIs agregados e gráfico de barras por país
- Responsividade mobile: KPIs 2 colunas, header compacto, padding reduzido

### Arquivos de configuração
- `.env.local` — variáveis de ambiente para desenvolvimento (mock ativo)
- `vercel.json` — cron jobs configurados
- `CLAUDE.md` + `AGENTS.md` — instruções para Claude Code

---

## O que ainda falta

### Obrigatório antes do primeiro uso real

- [ ] **Vercel Postgres** — criar banco no painel Vercel, substituir SQLite por PostgreSQL:
  - Atualizar `prisma/schema.prisma`: `provider = "postgresql"`
  - Atualizar `prisma.config.ts` com `DATABASE_URL` e `DIRECT_URL`
  - Rodar `npx prisma migrate deploy` em produção

- [ ] **Chave API Shipoffers** — obter no painel deles e confirmar:
  - URL base real da API
  - Estrutura exata dos campos na resposta (`id`, `tracking_code`, `destination_country`, etc.)
  - Ajustar `lib/shipoffers.ts` se os campos tiverem nomes diferentes

- [ ] **Chave API 17track** — criar conta em 17track.net e obter API key

- [ ] **Email SMTP** — configurar Gmail App Password ou migrar para Resend:
  - Confirmar email real da Shipoffers para `ALERT_TO_SHIPOFFERS`

- [ ] **Variáveis de ambiente na Vercel** — adicionar todas no painel:
  ```
  DATABASE_URL, DIRECT_URL
  SHIPOFFERS_API_URL, SHIPOFFERS_API_KEY
  SEVENTEENTRACK_API_URL, SEVENTEENTRACK_API_KEY
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
  ALERT_FROM, ALERT_TO_SHIPOFFERS
  DASHBOARD_USER, DASHBOARD_PASS
  CRON_SECRET, NEXT_PUBLIC_CRON_SECRET
  ```

- [ ] **Deploy** — `vercel --prod`
- [ ] **Crons na Vercel** — requerem plano Pro (Hobby só permite 1 cron)

### Melhorias de UI pendentes

- [ ] Responsividade da tabela em mobile — atualmente usa scroll horizontal; considerar view em cards para telas < 480px
- [ ] Página de métricas: gráfico de linha temporal (pedidos por semana) usando `recharts`
- [ ] Loading skeleton mais fiel ao layout real dos cards
- [ ] Feedback visual ao expandir linha da tabela (animação de abertura)
- [ ] Campo de busca por ID, nome do cliente ou código de rastreio

### Funcionalidades futuras

- [ ] Filtro por país de destino
- [ ] Exportar relatório CSV de pedidos atrasados
- [ ] Histórico de alertas enviados (página dedicada)
- [ ] Configuração de thresholds por país via interface (sem editar código)
- [ ] Webhook da Shipoffers para atualização em tempo real (elimina necessidade de polling)
- [ ] Notificação no dashboard quando novo atraso detectado (sem precisar recarregar)

---

## Estrutura de arquivos relevantes

```
app/
  page.tsx                  # Dashboard principal
  metrics/page.tsx          # Painel de métricas
  api/
    orders/route.ts
    sync/route.ts
    track/route.ts
    alerts/route.ts
    metrics/route.ts

components/
  OrdersTable.tsx           # Tabela com expand por clique
  StatsBar.tsx              # 5 KPI cards
  StatusBadge.tsx           # Badges de status semânticos
  DelayFlag.tsx             # Badge de atraso + email enviado
  SyncButton.tsx            # Botão sync manual
  MetricsPanel.tsx          # Painel de métricas
  Sidebar.tsx               # (criado mas não usado — single page)

lib/
  db.ts
  delay-rules.ts
  shipoffers.ts
  tracking.ts
  mailer.ts
  mock-data.ts

prisma/
  schema.prisma
prisma.config.ts
proxy.ts                    # HTTP Basic Auth (substitui middleware.ts)
vercel.json                 # Cron jobs
.env.local                  # Variáveis locais (USE_MOCK=true)
```

---

## Comandos úteis

```bash
# Desenvolvimento local (mock ativo)
npm run dev

# Rodar migration após mudança no schema
npx prisma migrate dev --name <nome>

# Regenerar client Prisma
npx prisma generate

# Deploy produção
vercel --prod

# Testar sync manualmente (com servidor rodando)
curl -X POST http://localhost:3000/api/sync \
  -H "x-cron-secret: dev_cron_secret_token_2024"
```

---

*Gerado em 09/04/2026 — Shipoffers Tracker v1.0 · OG Group*
