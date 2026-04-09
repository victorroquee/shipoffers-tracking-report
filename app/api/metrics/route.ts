import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMockMetrics } from '@/lib/mock-data'

const isMock = process.env.USE_MOCK === 'true'

export async function GET() {
  try {
    if (isMock) {
      return NextResponse.json(getMockMetrics())
    }

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
  } catch (error) {
    console.error('[METRICS ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
