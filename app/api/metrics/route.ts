import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMockMetrics } from '@/lib/mock-data'
import { buildDateWhere } from '@/lib/date-filter'

const isMock = process.env.USE_MOCK === 'true'

export async function GET() {
  try {
    if (isMock) return NextResponse.json(getMockMetrics())

    const cutoff = buildDateWhere()
    const withCutoff = (extra: Record<string, unknown>) => ({ AND: [cutoff, extra] })

    const [total, delivered, delayed, inTransit, pending, activeOrders] = await Promise.all([
      prisma.order.count({ where: cutoff }),
      prisma.order.count({ where: withCutoff({ status: 'DELIVERED' }) }),
      // Atrasado = dia 8+ (>7 dias desde pedido), excluindo entregues
      prisma.order.count({ where: withCutoff({ isDelayed: true, status: { not: 'DELIVERED' } }) }),
      prisma.order.count({ where: withCutoff({ status: 'IN_TRANSIT' }) }),
      prisma.order.count({ where: withCutoff({ status: 'PENDING' }) }),
      // All active orders (not delivered) for country breakdown
      prisma.order.findMany({
        where: withCutoff({ status: { not: 'DELIVERED' } }),
        select: { daysSinceOrder: true, daysInTransit: true, destinationCountry: true, isDelayed: true },
      }),
    ])

    // Average transit time from active orders
    const withDays = activeOrders.filter((o: typeof activeOrders[number]) => o.daysSinceOrder != null)
    const avgTransitTime = withDays.length
      ? Math.round(withDays.reduce((acc: number, o: typeof withDays[number]) => acc + (o.daysSinceOrder ?? 0), 0) / withDays.length)
      : null

    // Country breakdown: avg days since order for ALL active orders (not just delivered)
    const byCountry: Record<string, { days: number[]; total: number; delayed: number }> = {}
    for (const o of activeOrders) {
      const c = (o.destinationCountry ?? 'UNKNOWN').toUpperCase()
      if (!byCountry[c]) byCountry[c] = { days: [], total: 0, delayed: 0 }
      if (o.daysSinceOrder != null) byCountry[c].days.push(o.daysSinceOrder)
      byCountry[c].total++
      if (o.isDelayed) byCountry[c].delayed++
    }
    const avgByCountry = Object.entries(byCountry)
      .map(([country, d]) => ({
        country,
        avgDays: d.days.length ? Math.round(d.days.reduce((a, b) => a + b, 0) / d.days.length) : 0,
        total: d.total,
        delayed: d.delayed,
      }))
      .filter(c => c.total >= 1)
      .sort((a, b) => b.avgDays - a.avgDays)

    const active = total - delivered

    return NextResponse.json({
      total, active, delivered, delayed, inTransit, pending,
      avgTransitTime, avgByCountry,
    })
  } catch (error) {
    console.error('[METRICS ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
