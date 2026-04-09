// lib/mock-data.ts
// Dados mockados para desenvolvimento sem API keys reais.
// Toggle: USE_MOCK=true no .env.local

import { getDelayThreshold } from './delay-rules'

export interface MockOrder {
  id: string
  tracking_code?: string
  customer_name?: string
  customer_email?: string
  destination_country?: string
  shipped_at?: string
  status?: string
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// 30 pedidos mockados com distribuição realista
const MOCK_ORDERS: MockOrder[] = [
  // ===== ENTREGUES (10) =====
  { id: 'SO-10001', tracking_code: 'LX123456789DE', customer_name: 'Hans Müller', customer_email: 'hans@email.de', destination_country: 'DE', shipped_at: daysAgo(5), status: 'shipped' },
  { id: 'SO-10002', tracking_code: 'LX234567890FR', customer_name: 'Marie Dupont', customer_email: 'marie@email.fr', destination_country: 'FR', shipped_at: daysAgo(8), status: 'shipped' },
  { id: 'SO-10003', tracking_code: 'LX345678901NL', customer_name: 'Jan de Vries', customer_email: 'jan@email.nl', destination_country: 'NL', shipped_at: daysAgo(6), status: 'shipped' },
  { id: 'SO-10004', tracking_code: 'LX456789012GB', customer_name: 'James Smith', customer_email: 'james@email.co.uk', destination_country: 'GB', shipped_at: daysAgo(7), status: 'shipped' },
  { id: 'SO-10005', tracking_code: 'LX567890123US', customer_name: 'John Davis', customer_email: 'john@email.com', destination_country: 'US', shipped_at: daysAgo(10), status: 'shipped' },
  { id: 'SO-10006', tracking_code: 'LX678901234AT', customer_name: 'Stefan Gruber', customer_email: 'stefan@email.at', destination_country: 'AT', shipped_at: daysAgo(4), status: 'shipped' },
  { id: 'SO-10007', tracking_code: 'LX789012345SE', customer_name: 'Erik Svensson', customer_email: 'erik@email.se', destination_country: 'SE', shipped_at: daysAgo(9), status: 'shipped' },
  { id: 'SO-10008', tracking_code: 'LX890123456CH', customer_name: 'Luca Bernasconi', customer_email: 'luca@email.ch', destination_country: 'CH', shipped_at: daysAgo(5), status: 'shipped' },
  { id: 'SO-10009', tracking_code: 'LX901234567BE', customer_name: 'Pieter Janssens', customer_email: 'pieter@email.be', destination_country: 'BE', shipped_at: daysAgo(6), status: 'shipped' },
  { id: 'SO-10010', tracking_code: 'LX012345678DK', customer_name: 'Lars Andersen', customer_email: 'lars@email.dk', destination_country: 'DK', shipped_at: daysAgo(7), status: 'shipped' },

  // ===== EM TRÂNSITO — NORMAIS (8) =====
  { id: 'SO-10011', tracking_code: 'RR111222333IT', customer_name: 'Marco Rossi', customer_email: 'marco@email.it', destination_country: 'IT', shipped_at: daysAgo(5), status: 'shipped' },
  { id: 'SO-10012', tracking_code: 'RR222333444ES', customer_name: 'Carlos García', customer_email: 'carlos@email.es', destination_country: 'ES', shipped_at: daysAgo(4), status: 'shipped' },
  { id: 'SO-10013', tracking_code: 'RR333444555PT', customer_name: 'João Silva', customer_email: 'joao@email.pt', destination_country: 'PT', shipped_at: daysAgo(3), status: 'shipped' },
  { id: 'SO-10014', tracking_code: 'RR444555666PL', customer_name: 'Piotr Kowalski', customer_email: 'piotr@email.pl', destination_country: 'PL', shipped_at: daysAgo(6), status: 'shipped' },
  { id: 'SO-10015', tracking_code: 'RR555666777FI', customer_name: 'Matti Virtanen', customer_email: 'matti@email.fi', destination_country: 'FI', shipped_at: daysAgo(5), status: 'shipped' },
  { id: 'SO-10016', tracking_code: 'RR666777888CZ', customer_name: 'Tomáš Novák', customer_email: 'tomas@email.cz', destination_country: 'CZ', shipped_at: daysAgo(7), status: 'shipped' },
  { id: 'SO-10017', tracking_code: 'RR777888999HU', customer_name: 'Gábor Nagy', customer_email: 'gabor@email.hu', destination_country: 'HU', shipped_at: daysAgo(8), status: 'shipped' },
  { id: 'SO-10018', tracking_code: 'RR888999000NO', customer_name: 'Olav Hansen', customer_email: 'olav@email.no', destination_country: 'NO', shipped_at: daysAgo(6), status: 'shipped' },

  // ===== EM ATRASO (7) — daysInTransit > threshold =====
  { id: 'SO-10019', tracking_code: 'EE111000111DE', customer_name: 'Klaus Weber', customer_email: 'klaus@email.de', destination_country: 'DE', shipped_at: daysAgo(12), status: 'shipped' },  // threshold 7
  { id: 'SO-10020', tracking_code: 'EE222000222FR', customer_name: 'Pierre Moreau', customer_email: 'pierre@email.fr', destination_country: 'FR', shipped_at: daysAgo(16), status: 'shipped' },  // threshold 10
  { id: 'SO-10021', tracking_code: 'EE333000333IT', customer_name: 'Giuseppe Bianchi', customer_email: 'giuseppe@email.it', destination_country: 'IT', shipped_at: daysAgo(18), status: 'shipped' },  // threshold 12
  { id: 'SO-10022', tracking_code: 'EE444000444BR', customer_name: 'Ana Oliveira', customer_email: 'ana@email.com.br', destination_country: 'BR', shipped_at: daysAgo(25), status: 'shipped' },  // threshold 21
  { id: 'SO-10023', tracking_code: 'EE555000555US', customer_name: 'Emily Johnson', customer_email: 'emily@email.com', destination_country: 'US', shipped_at: daysAgo(20), status: 'shipped' },  // threshold 14
  { id: 'SO-10024', tracking_code: 'EE666000666RO', customer_name: 'Andrei Popescu', customer_email: 'andrei@email.ro', destination_country: 'RO', shipped_at: daysAgo(22), status: 'shipped' },  // threshold 18
  { id: 'SO-10025', tracking_code: 'EE777000777GB', customer_name: 'Sarah Wilson', customer_email: 'sarah@email.co.uk', destination_country: 'GB', shipped_at: daysAgo(15), status: 'shipped' },  // threshold 10

  // ===== EXCEÇÃO (2) =====
  { id: 'SO-10026', tracking_code: 'XX111222333PL', customer_name: 'Adam Wiśniewski', customer_email: 'adam@email.pl', destination_country: 'PL', shipped_at: daysAgo(10), status: 'shipped' },
  { id: 'SO-10027', tracking_code: 'XX222333444ES', customer_name: 'Lucía Fernández', customer_email: 'lucia@email.es', destination_country: 'ES', shipped_at: daysAgo(14), status: 'shipped' },

  // ===== PENDENTES / SEM TRACKING (3) =====
  { id: 'SO-10028', customer_name: 'Viktor Petrov', customer_email: 'viktor@email.hu', destination_country: 'HU', shipped_at: daysAgo(1), status: 'processing' },
  { id: 'SO-10029', customer_name: 'Nina Johansson', customer_email: 'nina@email.se', destination_country: 'SE', status: 'processing' },
  { id: 'SO-10030', tracking_code: 'PP999888777DE', customer_name: 'Felix Bauer', customer_email: 'felix@email.de', destination_country: 'DE', shipped_at: daysAgo(1), status: 'shipped' },
]

// Simula respostas de tracking para os pedidos mockados
type MockTrackingStatus = 'PENDING' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'UNKNOWN'

interface MockTrackingResult {
  trackingCode: string
  status: MockTrackingStatus
  deliveredAt: Date | null
  rawData: string
}

const TRACKING_STATUS_MAP: Record<string, MockTrackingStatus> = {
  // Entregues
  'LX123456789DE': 'DELIVERED',
  'LX234567890FR': 'DELIVERED',
  'LX345678901NL': 'DELIVERED',
  'LX456789012GB': 'DELIVERED',
  'LX567890123US': 'DELIVERED',
  'LX678901234AT': 'DELIVERED',
  'LX789012345SE': 'DELIVERED',
  'LX890123456CH': 'DELIVERED',
  'LX901234567BE': 'DELIVERED',
  'LX012345678DK': 'DELIVERED',
  // Em trânsito normal
  'RR111222333IT': 'IN_TRANSIT',
  'RR222333444ES': 'IN_TRANSIT',
  'RR333444555PT': 'IN_TRANSIT',
  'RR444555666PL': 'IN_TRANSIT',
  'RR555666777FI': 'IN_TRANSIT',
  'RR666777888CZ': 'IN_TRANSIT',
  'RR777888999HU': 'IN_TRANSIT',
  'RR888999000NO': 'OUT_FOR_DELIVERY',
  // Em atraso
  'EE111000111DE': 'IN_TRANSIT',
  'EE222000222FR': 'IN_TRANSIT',
  'EE333000333IT': 'IN_TRANSIT',
  'EE444000444BR': 'IN_TRANSIT',
  'EE555000555US': 'IN_TRANSIT',
  'EE666000666RO': 'IN_TRANSIT',
  'EE777000777GB': 'IN_TRANSIT',
  // Exceção
  'XX111222333PL': 'EXCEPTION',
  'XX222333444ES': 'EXCEPTION',
  // Pendente
  'PP999888777DE': 'PENDING',
}

export function getMockOrders(): MockOrder[] {
  return MOCK_ORDERS
}

export function getMockTrackingResults(codes: string[]): MockTrackingResult[] {
  return codes.map(code => {
    const status = TRACKING_STATUS_MAP[code] ?? 'UNKNOWN'
    return {
      trackingCode: code,
      status,
      deliveredAt: status === 'DELIVERED' ? new Date(Date.now() - Math.random() * 86400000 * 3) : null,
      rawData: JSON.stringify({ mock: true, number: code, status }),
    }
  })
}

export function getMockMetrics() {
  const total = MOCK_ORDERS.length
  const deliveredCount = Object.values(TRACKING_STATUS_MAP).filter(s => s === 'DELIVERED').length
  const delayedCount = 7
  const inTransitCount = Object.values(TRACKING_STATUS_MAP).filter(s => s === 'IN_TRANSIT').length - delayedCount

  const avgByCountry = [
    { country: 'BR', avgDays: 19, count: 1 },
    { country: 'RO', avgDays: 16, count: 1 },
    { country: 'IT', avgDays: 12, count: 2 },
    { country: 'FR', avgDays: 11, count: 2 },
    { country: 'US', avgDays: 10, count: 2 },
    { country: 'GB', avgDays: 9, count: 2 },
    { country: 'ES', avgDays: 8, count: 2 },
    { country: 'PL', avgDays: 7, count: 2 },
    { country: 'DE', avgDays: 5, count: 3 },
    { country: 'NL', avgDays: 5, count: 1 },
    { country: 'SE', avgDays: 6, count: 1 },
    { country: 'AT', avgDays: 4, count: 1 },
    { country: 'CH', avgDays: 4, count: 1 },
    { country: 'BE', avgDays: 5, count: 1 },
    { country: 'DK', avgDays: 6, count: 1 },
  ].sort((a, b) => b.avgDays - a.avgDays)

  return {
    total,
    delivered: deliveredCount,
    delayed: delayedCount,
    inTransit: inTransitCount,
    deliveryRate: total > 0 ? Math.round((deliveredCount / total) * 100) : 0,
    avgTransitTime: 8,
    avgByCountry,
  }
}

// Gerar dados de DB mockados (formato completo como sairia do Prisma)
export function getMockDBOrders() {
  const now = new Date()

  return MOCK_ORDERS.map((o, i) => {
    const shippedAt = o.shipped_at ? new Date(o.shipped_at) : null
    const daysInTransit = shippedAt
      ? Math.floor((now.getTime() - shippedAt.getTime()) / 86400000) : null
    const delayThreshold = getDelayThreshold(o.destination_country)
    const trackingStatus = o.tracking_code ? (TRACKING_STATUS_MAP[o.tracking_code] ?? 'UNKNOWN') : 'UNKNOWN'
    const isDelayed = trackingStatus !== 'DELIVERED' && daysInTransit !== null && daysInTransit > delayThreshold

    // Pedidos entregues: simular data de entrega
    const deliveredAt = trackingStatus === 'DELIVERED' && shippedAt
      ? new Date(shippedAt.getTime() + (daysInTransit! - 1) * 86400000)
      : null

    return {
      id: `mock-${i + 1}`,
      shipofffersId: o.id,
      trackingCode: o.tracking_code ?? null,
      customerName: o.customer_name ?? null,
      customerEmail: o.customer_email ?? null,
      destinationCountry: o.destination_country ?? null,
      shippedAt,
      deliveredAt,
      status: trackingStatus,
      lastTrackingSync: now,
      daysInTransit,
      delayThreshold,
      isDelayed,
      alertSentAt: isDelayed && i % 2 === 0 ? new Date(now.getTime() - 12 * 60 * 60 * 1000) : null,
      rawTrackingData: null,
      createdAt: now,
      updatedAt: now,
      events: isDelayed ? [
        {
          id: `evt-${i}-1`,
          orderId: `mock-${i + 1}`,
          status: trackingStatus,
          description: `Dia ${daysInTransit} em trânsito (limite: ${delayThreshold} dias)`,
          occurredAt: now,
          createdAt: now,
        }
      ] : [],
    }
  })
}
