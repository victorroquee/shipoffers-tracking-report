# orquestrador.md — Shipoffers Order Tracker
> Documento de execução autônoma para Claude Code. Leia tudo antes de escrever qualquer linha de código.

---

## 1. CONTEXTO E DECISÕES DO PROJETO

| Decisão | Valor |
|---|---|
| Acesso à Shipoffers | API com chave (a ser gerada no painel deles) |
| Deploy | Vercel |
| Volume de pedidos ativos | 100–500 simultâneos |
| Destinatário de alertas | Somente Shipoffers (email interno) |
| Threshold de atraso | **Varia por país de destino** (tabela na seção 6) |
| Histórico de status | Somente pedidos atrasados (`OrderEvent` seletivo) |
| Frequência de tracking | 2x por dia — 08:00 e 20:00 (horário de Brasília) |
| Acesso ao dashboard | Time interno — protegido por senha (HTTP Basic Auth via Middleware) |
| Funcionalidades extras | Painel de métricas (taxa de entrega, tempo médio por país, etc.) |

---

## 2. ARQUITETURA

```
shipoffers-tracker/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Dashboard principal (tabela de pedidos)
│   ├── metrics/
│   │   └── page.tsx                    # Painel de métricas
│   └── api/
│       ├── orders/route.ts             # GET: lista pedidos com filtros
│       ├── sync/route.ts               # POST: puxa pedidos da Shipoffers → DB
│       ├── track/route.ts              # POST: atualiza tracking via 17track
│       ├── alerts/route.ts             # POST: dispara emails de atraso
│       └── metrics/route.ts            # GET: agrega métricas para o painel
├── components/
│   ├── OrdersTable.tsx
│   ├── StatusBadge.tsx
│   ├── DelayFlag.tsx
│   ├── SyncButton.tsx
│   ├── StatsBar.tsx
│   └── MetricsPanel.tsx
├── lib/
│   ├── shipoffers.ts
│   ├── tracking.ts
│   ├── mailer.ts
│   ├── db.ts
│   └── delay-rules.ts                  # Thresholds por país
├── middleware.ts                        # HTTP Basic Auth
├── prisma/
│   └── schema.prisma
├── vercel.json                          # Cron jobs
└── .env.local
```

---

## 3. SCHEMA DO BANCO DE DADOS

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  // Usar Vercel Postgres (neon.tech) — gratuito no plano Vercel Hobby/Pro
}

model Order {
  id                 String       @id @default(cuid())
  shipofffersId      String       @unique
  trackingCode       String?
  customerName       String?
  customerEmail      String?
  destinationCountry String?      // código ISO ex: "DE", "FR", "IT"
  shippedAt          DateTime?
  deliveredAt        DateTime?
  status             String       @default("UNKNOWN")
  // PENDING | IN_TRANSIT | OUT_FOR_DELIVERY | DELIVERED | EXCEPTION | UNKNOWN
  lastTrackingSync   DateTime?
  daysInTransit      Int?
  delayThreshold     Int?         // threshold em dias para este destino (preenchido no sync)
  isDelayed          Boolean      @default(false)
  alertSentAt        DateTime?    // debounce de 24h
  rawTrackingData    String?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  events             OrderEvent[]
}

model OrderEvent {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  status      String
  description String?
  occurredAt  DateTime
  createdAt   DateTime @default(now())

  // Criado SOMENTE quando o pedido está em estado isDelayed = true
}
```

---

## 4. VARIÁVEIS DE AMBIENTE

```env
# Banco (Vercel Postgres / Neon)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Shipoffers
SHIPOFFERS_API_URL="https://api.shipoffers.com"   # confirmar URL real na documentação
SHIPOFFERS_API_KEY="sua_chave_aqui"

# 17track
SEVENTEENTRACK_API_URL="https://api.17track.net/track/v2"
SEVENTEENTRACK_API_KEY="sua_chave_aqui"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu_email@oggroup.com"
SMTP_PASS="app_password_do_gmail"
ALERT_FROM="Tracker OG Group <seu_email@oggroup.com>"
ALERT_TO_SHIPOFFERS="suporte@shipoffers.com"

# Autenticação do dashboard (HTTP Basic Auth)
DASHBOARD_USER="oggroup"
DASHBOARD_PASS="senha_forte_aqui"

# Proteção das rotas de cron
CRON_SECRET="token_secreto_longo_aqui"
NEXT_PUBLIC_CRON_SECRET="token_secreto_longo_aqui"   # mesmo valor, exposto ao client para sync manual
```

---

## 5. AUTENTICAÇÃO — middleware.ts

Protege todas as páginas do Next.js. Rotas `/api/*` usam o próprio `CRON_SECRET`.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic') {
      const [user, pass] = Buffer.from(encoded, 'base64').toString('utf-8').split(':')
      if (user === process.env.DASHBOARD_USER && pass === process.env.DASHBOARD_PASS) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Acesso restrito', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="OG Group — Shipoffers Tracker"' },
  })
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
```

---

## 6. THRESHOLDS POR PAÍS — lib/delay-rules.ts

```typescript
// lib/delay-rules.ts

// ⚠️ Ajustar os valores abaixo conforme experiência real com cada destino.
// Claude Code NÃO deve alterar estes valores — deixar para o time definir.

const DELAY_RULES: Record<string, number> = {
  DE: 7,   // Alemanha
  AT: 7,   // Áustria
  CH: 7,   // Suíça
  NL: 7,   // Holanda
  BE: 7,   // Bélgica
  FR: 10,  // França
  PT: 10,  // Portugal
  SE: 10,  // Suécia
  DK: 10,  // Dinamarca
  GB: 10,  // Reino Unido
  FI: 12,  // Finlândia
  IT: 12,  // Itália
  ES: 12,  // Espanha
  PL: 14,  // Polônia
  CZ: 14,  // República Tcheca
  HU: 14,  // Hungria
  NO: 14,  // Noruega
  US: 14,  // EUA
  RO: 18,  // Romênia
  BR: 21,  // Brasil
  DEFAULT: 14,
}

export function getDelayThreshold(countryCode: string | null | undefined): number {
  if (!countryCode) return DELAY_RULES.DEFAULT
  return DELAY_RULES[countryCode.toUpperCase()] ?? DELAY_RULES.DEFAULT
}
```

---

## 7. IMPLEMENTAÇÃO

### 7.1 Setup

```bash
npx create-next-app@latest shipoffers-tracker --typescript --tailwind --app --no-src-dir
cd shipoffers-tracker
npm install prisma @prisma/client axios nodemailer
npm install -D @types/nodemailer
npx prisma init
# Copiar schema → prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma generate
```

---

### 7.2 lib/db.ts

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

### 7.3 lib/shipoffers.ts

> ⚠️ Investigar documentação real da API antes de implementar. Campos abaixo são mapeamento provável — ajustar conforme resposta real do endpoint.

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: process.env.SHIPOFFERS_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.SHIPOFFERS_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

export interface ShipoffersOrder {
  id: string
  tracking_code?: string
  customer_name?: string
  customer_email?: string
  destination_country?: string  // código ISO ex: "DE"
  shipped_at?: string           // ISO 8601
  status?: string
}

export async function fetchAllOrders(): Promise<ShipoffersOrder[]> {
  const all: ShipoffersOrder[] = []
  let page = 1
  const limit = 100

  while (true) {
    const { data } = await client.get('/orders', { params: { page, limit } })
    const orders: ShipoffersOrder[] = data?.orders ?? data?.data ?? data ?? []
    if (!orders.length) break
    all.push(...orders)
    if (orders.length < limit) break
    page++
  }

  return all
}
```

---

### 7.4 lib/tracking.ts

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: process.env.SEVENTEENTRACK_API_URL,
  headers: {
    '17token': process.env.SEVENTEENTRACK_API_KEY,
    'Content-Type': 'application/json',
  },
})

export type TrackingStatus =
  | 'PENDING' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY'
  | 'DELIVERED' | 'EXCEPTION' | 'UNKNOWN'

function mapStatus(tag: number): TrackingStatus {
  switch (tag) {
    case 0:  return 'IN_TRANSIT'
    case 10: return 'IN_TRANSIT'
    case 20: return 'OUT_FOR_DELIVERY'
    case 30: return 'DELIVERED'
    case 35: return 'EXCEPTION'
    default: return 'UNKNOWN'
  }
}

export interface TrackingResult {
  trackingCode: string
  status: TrackingStatus
  deliveredAt: Date | null
  rawData: string
}

export async function trackPackages(codes: string[]): Promise<TrackingResult[]> {
  if (!codes.length) return []

  // 17track aceita até 40 códigos por request
  const chunks: string[][] = []
  for (let i = 0; i < codes.length; i += 40) chunks.push(codes.slice(i, i + 40))

  const results: TrackingResult[] = []

  for (const chunk of chunks) {
    const { data } = await client.post('/gettrackinfo', {
      data: chunk.map(number => ({ number })),
    })

    for (const item of data?.data?.accepted ?? []) {
      const tag = item?.track?.b ?? -1
      const status = mapStatus(tag)
      const latestEvent = (item?.track?.z0 ?? [])[0]
      const deliveredAt = status === 'DELIVERED' && latestEvent?.a
        ? new Date(latestEvent.a) : null

      results.push({
        trackingCode: item.number,
        status,
        deliveredAt,
        rawData: JSON.stringify(item),
      })
    }
  }

  return results
}
```

---

### 7.5 lib/mailer.ts

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export interface DelayedOrder {
  shipofffersId: string
  trackingCode: string | null
  customerName: string | null
  destinationCountry: string | null
  shippedAt: Date | null
  daysInTransit: number | null
  delayThreshold: number | null
  status: string
}

export async function sendDelayAlert(orders: DelayedOrder[]): Promise<void> {
  if (!orders.length) return

  const rows = orders.map(o => `
    <tr>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.shipofffersId}</td>
      <td style="padding:8px;border:1px solid #2a2a2a;font-family:monospace">${o.trackingCode ?? '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.customerName ?? '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.destinationCountry ?? '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.shippedAt ? new Date(o.shippedAt).toLocaleDateString('pt-BR') : '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a;color:#ff4444;font-weight:bold">
        ${o.daysInTransit ?? '?'} dias (limite: ${o.delayThreshold ?? '?'})
      </td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.status}</td>
    </tr>`).join('')

  await transporter.sendMail({
    from: process.env.ALERT_FROM,
    to: process.env.ALERT_TO_SHIPOFFERS,
    subject: `⚠️ ${orders.length} pedido(s) em atraso — OG Group`,
    html: `
      <div style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:32px;max-width:900px;margin:0 auto;border-radius:8px">
        <h2 style="color:#ff4444;margin-top:0">⚠️ Pedidos em Atraso — OG Group</h2>
        <p style="color:#aaa">Os pedidos abaixo ultrapassaram o threshold de dias em trânsito sem confirmação de entrega.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#1a1a1a;color:#888;text-transform:uppercase;font-size:11px">
              <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">ID</th>
              <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Rastreio</th>
              <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Cliente</th>
              <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">País</th>
              <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Enviado em</th>
              <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Dias / Limite</th>
              <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#555;font-size:11px;margin-top:24px">Enviado automaticamente pelo Shipoffers Tracker — OG Group</p>
      </div>
    `,
  })
}
```

---

### 7.6 API Routes

#### `app/api/sync/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchAllOrders } from '@/lib/shipoffers'
import { getDelayThreshold } from '@/lib/delay-rules'

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await fetchAllOrders()

  for (const o of orders) {
    const shippedAt = o.shipped_at ? new Date(o.shipped_at) : null
    const daysInTransit = shippedAt
      ? Math.floor((Date.now() - shippedAt.getTime()) / 86400000) : null
    const delayThreshold = getDelayThreshold(o.destination_country)

    await prisma.order.upsert({
      where: { shipofffersId: o.id },
      create: {
        shipofffersId: o.id,
        trackingCode: o.tracking_code ?? null,
        customerName: o.customer_name ?? null,
        customerEmail: o.customer_email ?? null,
        destinationCountry: o.destination_country ?? null,
        shippedAt,
        daysInTransit,
        delayThreshold,
        status: 'UNKNOWN',
      },
      update: {
        trackingCode: o.tracking_code ?? undefined,
        customerName: o.customer_name ?? undefined,
        destinationCountry: o.destination_country ?? undefined,
        shippedAt: shippedAt ?? undefined,
        daysInTransit,
        delayThreshold,
      },
    })
  }

  return NextResponse.json({ success: true, total: orders.length })
}
```

---

#### `app/api/track/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { trackPackages } from '@/lib/tracking'

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: {
      trackingCode: { not: null },
      status: { notIn: ['DELIVERED'] },
    },
  })

  const results = await trackPackages(orders.map(o => o.trackingCode!))

  for (const result of results) {
    const order = orders.find(o => o.trackingCode === result.trackingCode)
    if (!order) continue

    const now = new Date()
    const daysInTransit = order.shippedAt
      ? Math.floor((now.getTime() - order.shippedAt.getTime()) / 86400000) : null

    const threshold = order.delayThreshold ?? 14
    const isDelayed = result.status !== 'DELIVERED' &&
      daysInTransit !== null && daysInTransit > threshold

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: result.status,
        deliveredAt: result.deliveredAt ?? undefined,
        daysInTransit,
        isDelayed,
        lastTrackingSync: now,
        rawTrackingData: result.rawData,
      },
    })

    // Gravar evento de histórico SOMENTE se pedido está atrasado
    if (isDelayed) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: result.status,
          description: `Dia ${daysInTransit} em trânsito (limite: ${threshold} dias)`,
          occurredAt: now,
        },
      })
    }
  }

  return NextResponse.json({ success: true, tracked: results.length })
}
```

---

#### `app/api/alerts/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendDelayAlert } from '@/lib/mailer'

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const delayed = await prisma.order.findMany({
    where: {
      isDelayed: true,
      status: { notIn: ['DELIVERED'] },
      OR: [
        { alertSentAt: null },
        { alertSentAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  })

  if (delayed.length > 0) {
    await sendDelayAlert(delayed.map(o => ({
      shipofffersId: o.shipofffersId,
      trackingCode: o.trackingCode,
      customerName: o.customerName,
      destinationCountry: o.destinationCountry,
      shippedAt: o.shippedAt,
      daysInTransit: o.daysInTransit,
      delayThreshold: o.delayThreshold,
      status: o.status,
    })))

    await prisma.order.updateMany({
      where: { id: { in: delayed.map(o => o.id) } },
      data: { alertSentAt: new Date() },
    })
  }

  return NextResponse.json({ success: true, alertsSent: delayed.length })
}
```

---

#### `app/api/orders/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter')

  const where: any = {}
  if (filter === 'delayed') where.isDelayed = true
  if (filter === 'delivered') where.status = 'DELIVERED'

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ isDelayed: 'desc' }, { daysInTransit: 'desc' }],
    include: {
      events: filter === 'delayed'
        ? { orderBy: { occurredAt: 'desc' }, take: 5 }
        : false,
    },
  })

  return NextResponse.json(orders)
}
```

---

#### `app/api/metrics/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const [total, delivered, delayed, inTransit, deliveredOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { isDelayed: true, status: { not: 'DELIVERED' } } }),
    prisma.order.count({ where: { status: 'IN_TRANSIT' } }),
    prisma.order.findMany({
      where: { status: 'DELIVERED', daysInTransit: { not: null } },
      select: { daysInTransit: true, destinationCountry: true },
    }),
  ])

  const avgTransitTime = deliveredOrders.length
    ? Math.round(deliveredOrders.reduce((acc, o) => acc + (o.daysInTransit ?? 0), 0) / deliveredOrders.length)
    : null

  const byCountry: Record<string, number[]> = {}
  for (const o of deliveredOrders) {
    const c = o.destinationCountry ?? 'UNKNOWN'
    if (!byCountry[c]) byCountry[c] = []
    byCountry[c].push(o.daysInTransit!)
  }

  const avgByCountry = Object.entries(byCountry).map(([country, days]) => ({
    country,
    avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
    count: days.length,
  })).sort((a, b) => b.avgDays - a.avgDays)

  return NextResponse.json({
    total, delivered, delayed, inTransit,
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    avgTransitTime,
    avgByCountry,
  })
}
```

---

### 7.7 Vercel Cron — vercel.json

```json
{
  "crons": [
    { "path": "/api/sync",   "schedule": "0 11 * * *"    },
    { "path": "/api/track",  "schedule": "0 11,23 * * *" },
    { "path": "/api/alerts", "schedule": "30 11,23 * * *" }
  ]
}
```

> Todos os horários são UTC.
> `11:00 UTC` = `08:00 BRT` | `23:00 UTC` = `20:00 BRT`
> Sequência por turno: **sync (0min) → track (0min) → alerts (30min depois)**

---

## 8. COMPONENTES

### components/OrdersTable.tsx

```typescript
import StatusBadge from './StatusBadge'
import DelayFlag from './DelayFlag'

export default function OrdersTable({ orders, showEvents }: { orders: any[], showEvents?: boolean }) {
  if (!orders.length)
    return <div className="text-center py-20 text-zinc-600">Nenhum pedido encontrado.</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Rastreio</th>
            <th className="px-4 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">País</th>
            <th className="px-4 py-3 text-left">Enviado em</th>
            <th className="px-4 py-3 text-left">Dias em Trânsito</th>
            <th className="px-4 py-3 text-left">Limite</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {orders.map(order => (
            <>
              <tr
                key={order.id}
                className={`transition-colors hover:bg-zinc-900/50 ${order.isDelayed ? 'bg-red-950/20' : ''}`}
              >
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{order.shipofffersId}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {order.trackingCode ? (
                    <a
                      href={`https://t.17track.net/en#nums=${order.trackingCode}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {order.trackingCode}
                    </a>
                  ) : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-4 py-3 text-zinc-300">{order.customerName ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded">
                    {order.destinationCountry ?? '?'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-3">
                  {order.daysInTransit != null ? (
                    <span className={order.isDelayed ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                      {order.daysInTransit} dias
                    </span>
                  ) : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {order.delayThreshold ? `${order.delayThreshold}d` : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3"><DelayFlag isDelayed={order.isDelayed} alertSentAt={order.alertSentAt} /></td>
              </tr>
              {showEvents && order.events?.length > 0 && (
                <tr key={`${order.id}-events`} className="bg-red-950/10">
                  <td colSpan={9} className="px-8 py-2">
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                      {order.events.map((e: any) => (
                        <span key={e.id}>
                          {new Date(e.occurredAt).toLocaleDateString('pt-BR')} — {e.description}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### components/StatusBadge.tsx

```typescript
const config: Record<string, { label: string; cls: string }> = {
  DELIVERED:        { label: '✓ Entregue',         cls: 'bg-green-900/40 text-green-400 border-green-800' },
  IN_TRANSIT:       { label: '→ Em Trânsito',       cls: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  OUT_FOR_DELIVERY: { label: '↗ Saiu p/ Entrega',   cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-800' },
  EXCEPTION:        { label: '✕ Exceção',            cls: 'bg-red-900/40 text-red-400 border-red-800' },
  PENDING:          { label: '· Pendente',           cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  UNKNOWN:          { label: '? Desconhecido',       cls: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? config.UNKNOWN
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  )
}
```

### components/DelayFlag.tsx

```typescript
export default function DelayFlag({ isDelayed, alertSentAt }: { isDelayed: boolean; alertSentAt: string | null }) {
  if (!isDelayed) return <span className="text-zinc-700 text-xs">—</span>
  return (
    <span
      title={alertSentAt
        ? `Email enviado em ${new Date(alertSentAt).toLocaleString('pt-BR')}`
        : 'Email pendente de envio'}
      className="inline-flex items-center gap-1 text-red-400 font-semibold text-xs"
    >
      ⚠️ ATRASO
      {alertSentAt && <span className="text-zinc-600 font-normal">(✉ enviado)</span>}
    </span>
  )
}
```

### components/StatsBar.tsx

```typescript
export default function StatsBar({ orders }: { orders: any[] }) {
  const total = orders.length
  const delivered = orders.filter(o => o.status === 'DELIVERED').length
  const inTransit = orders.filter(o => o.status === 'IN_TRANSIT').length
  const delayed = orders.filter(o => o.isDelayed && o.status !== 'DELIVERED').length
  const rate = total > 0 ? Math.round((delivered / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {[
        { label: 'Total',        value: total,      color: 'text-white' },
        { label: 'Em Trânsito',  value: inTransit,  color: 'text-blue-400' },
        { label: 'Entregues',    value: delivered,  color: 'text-green-400' },
        { label: 'Em Atraso',    value: delayed,    color: 'text-red-400' },
        { label: 'Taxa Entrega', value: `${rate}%`, color: rate >= 90 ? 'text-green-400' : rate >= 70 ? 'text-yellow-400' : 'text-red-400' },
      ].map(s => (
        <div key={s.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-zinc-500 text-xs mb-1">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}
```

### components/MetricsPanel.tsx

```typescript
export default function MetricsPanel({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Taxa de Entrega',     value: `${data.deliveryRate}%`, color: data.deliveryRate >= 90 ? 'text-green-400' : 'text-yellow-400' },
          { label: 'Tempo Médio (dias)',   value: data.avgTransitTime ?? '—', color: 'text-blue-400' },
          { label: 'Total Atrasados',      value: data.delayed, color: 'text-red-400' },
          { label: 'Em Trânsito',          value: data.inTransit, color: 'text-zinc-300' },
        ].map(k => (
          <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs mb-2">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Tempo médio em trânsito por país (pedidos entregues)</h3>
        <div className="space-y-3">
          {data.avgByCountry?.map((c: any) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded w-14 text-center shrink-0">
                {c.country}
              </span>
              <div className="flex-1 bg-zinc-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min((c.avgDays / 30) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-32 text-right shrink-0">
                {c.avgDays} dias · {c.count} pedidos
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### components/SyncButton.tsx

```typescript
'use client'
import { useState } from 'react'

export default function SyncButton({ onSynced }: { onSynced: () => void }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handle() {
    setLoading(true); setMsg('')
    const headers = { 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET ?? '' }
    try {
      await fetch('/api/sync',  { method: 'POST', headers })
      await fetch('/api/track', { method: 'POST', headers })
      setMsg('Sincronizado!')
      onSynced()
    } catch { setMsg('Erro ao sincronizar') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-zinc-500">{msg}</span>}
      <button
        onClick={handle} disabled={loading}
        className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-40 transition"
      >
        {loading ? 'Sincronizando...' : '🔄 Sync Manual'}
      </button>
    </div>
  )
}
```

---

## 9. PÁGINAS

### app/page.tsx

```typescript
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import OrdersTable from '@/components/OrdersTable'
import StatsBar from '@/components/StatsBar'
import SyncButton from '@/components/SyncButton'

export default function HomePage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'delayed' | 'delivered'>('all')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/orders?filter=${filter}`)
    setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  return (
    <main className="min-h-screen bg-[#080808] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shipoffers Tracker</h1>
            <p className="text-zinc-500 text-sm mt-1">Monitoramento de pedidos — OG Group</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/metrics" className="text-sm text-zinc-400 hover:text-white transition">
              📊 Métricas
            </Link>
            <SyncButton onSynced={load} />
          </div>
        </div>

        <StatsBar orders={orders} />

        <div className="flex gap-2 mt-6 mb-4">
          {(['all', 'delayed', 'delivered'] as const).map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'delayed' ? '⚠️ Em Atraso' : '✅ Entregues'}
            </button>
          ))}
        </div>

        {loading
          ? <div className="text-center py-20 text-zinc-600">Carregando...</div>
          : <OrdersTable orders={orders} showEvents={filter === 'delayed'} />
        }
      </div>
    </main>
  )
}
```

### app/metrics/page.tsx

```typescript
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import MetricsPanel from '@/components/MetricsPanel'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(setMetrics)
  }, [])

  return (
    <main className="min-h-screen bg-[#080808] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-zinc-500 hover:text-white text-sm transition">← Voltar</Link>
          <h1 className="text-2xl font-bold">Métricas de Entrega</h1>
        </div>
        {metrics
          ? <MetricsPanel data={metrics} />
          : <div className="text-center py-20 text-zinc-600">Carregando...</div>
        }
      </div>
    </main>
  )
}
```

---

## 10. REGRAS DE NEGÓCIO — REFERÊNCIA RÁPIDA

| Regra | Implementação |
|---|---|
| Threshold varia por país | `getDelayThreshold(destinationCountry)` salvo no `Order.delayThreshold` no sync |
| `isDelayed` | `daysInTransit > delayThreshold AND status != DELIVERED` |
| Histórico de eventos | Criado **apenas** quando `isDelayed = true` — não para pedidos normais |
| Email de alerta | Somente para Shipoffers; debounce de 24h por pedido |
| Re-envio de alerta | Se `alertSentAt < now - 24h` E pedido ainda atrasado → reenvia |
| Sync idempotente | `upsert` por `shipofffersId` — nunca duplica |
| Pedidos sem tracking code | Entram com status `UNKNOWN`, pulados na etapa de track |
| Autenticação | HTTP Basic Auth via `middleware.ts` — todo o dashboard protegido |
| Cron (BRT) | Sync 08h, Track 08h+20h, Alerts 08h30+20h30 |

---

## 11. ORDEM DE EXECUÇÃO PARA CLAUDE CODE

```
1.  Setup Next.js + dependências (seção 7.1)
2.  Criar prisma/schema.prisma (seção 3)
3.  npx prisma migrate dev --name init && npx prisma generate
4.  Criar .env.local (seção 4)
5.  Criar middleware.ts (seção 5)
6.  lib/db.ts
7.  lib/delay-rules.ts        ← NÃO alterar os valores numéricos
8.  lib/shipoffers.ts         ← confirmar campos reais da API antes
9.  lib/tracking.ts
10. lib/mailer.ts
11. app/api/sync/route.ts
12. app/api/track/route.ts
13. app/api/alerts/route.ts
14. app/api/orders/route.ts
15. app/api/metrics/route.ts
16. components/StatusBadge.tsx
17. components/DelayFlag.tsx
18. components/StatsBar.tsx
19. components/MetricsPanel.tsx
20. components/SyncButton.tsx
21. components/OrdersTable.tsx
22. app/page.tsx
23. app/metrics/page.tsx
24. vercel.json (seção 7.7)
25. Configurar Vercel Postgres → adicionar DATABASE_URL + DIRECT_URL
26. vercel --prod
27. Testar sync manual via botão do dashboard
28. Testar tracking de 1 código real via 17track
29. Testar envio de email via POST /api/alerts
```

---

## 12. PRÉ-REQUISITOS ANTES DE RODAR

- [ ] Gerar chave API da Shipoffers no painel deles e confirmar URL base real + estrutura dos campos
- [ ] Criar conta em [17track.net/en/apiDoc](https://www.17track.net/en/apiDoc) e obter API key
- [ ] Criar App Password no Gmail (Conta → Segurança → Senhas de app) — ou trocar por Resend/SendGrid
- [ ] Criar banco Vercel Postgres (dashboard Vercel → Storage) e copiar `DATABASE_URL` + `DIRECT_URL`
- [ ] Confirmar email real da Shipoffers para `ALERT_TO_SHIPOFFERS`
- [ ] Revisar thresholds por país em `lib/delay-rules.ts` com o time antes do primeiro deploy

---

*orquestrador v2 — customizado para OG Group · Vercel · PostgreSQL · 100–500 pedidos · threshold por país · acesso em time · painel de métricas*