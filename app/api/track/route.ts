import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { trackPackages } from '@/lib/tracking'
import { STATUS_RANK, POLLING_INTERVALS } from '@/lib/constants'

function getPollingInterval(daysInTransit: number | null): number {
  const days = daysInTransit ?? 0
  for (const rule of POLLING_INTERVALS) {
    if (days <= rule.maxDays) return rule.intervalHours * 60 * 60 * 1000
  }
  return 7 * 24 * 60 * 60 * 1000
}

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch all undelivered orders with tracking codes
    const allOrders = await prisma.order.findMany({
      where: {
        trackingCode: { not: null },
        status: { notIn: ['DELIVERED'] },
      },
      orderBy: [
        { lastTrackingSync: { sort: 'asc', nulls: 'first' } },
      ],
    })

    // Smart polling: only query orders whose interval has elapsed
    const now = Date.now()
    const dueOrders = allOrders.filter(order => {
      if (!order.lastTrackingSync) return true
      const interval = getPollingInterval(order.daysInTransit)
      return now - order.lastTrackingSync.getTime() >= interval
    })

    const codes = dueOrders.map((o: typeof dueOrders[number]) => o.trackingCode!).filter(Boolean)
    const results = await trackPackages(codes)

    let updated = 0
    for (const result of results) {
      const order = dueOrders.find((o: typeof dueOrders[number]) => o.trackingCode === result.trackingCode)
      if (!order) continue

      const nowDate = new Date()
      const daysInTransit = order.shippedAt
        ? Math.floor((nowDate.getTime() - order.shippedAt.getTime()) / 86400000) : null
      // Delay countdown from order date, not ship date
      const orderDate = order.orderedAt ?? order.shippedAt
      const daysSinceOrder = orderDate
        ? Math.floor((nowDate.getTime() - orderDate.getTime()) / 86400000) : null

      const currentRank = STATUS_RANK[order.status] ?? 0
      const newRank = STATUS_RANK[result.status] ?? 0
      const effectiveStatus = newRank >= currentRank ? result.status : order.status

      const threshold = order.delayThreshold ?? 14
      const isDelayed = effectiveStatus !== 'DELIVERED' &&
        daysSinceOrder !== null && daysSinceOrder > threshold

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: effectiveStatus,
          deliveredAt: result.deliveredAt ?? undefined,
          daysSinceOrder,
          daysInTransit,
          isDelayed,
          lastTrackingSync: nowDate,
          rawTrackingData: result.rawData,
        },
      })

      if (isDelayed) {
        await prisma.orderEvent.create({
          data: {
            orderId: order.id,
            status: result.status,
            description: `Dia ${daysSinceOrder} desde pedido (limite: ${threshold} dias)`,
            occurredAt: nowDate,
          },
        })
      }

      updated++
    }

    return NextResponse.json({
      success: true,
      tracked: updated,
      skipped: allOrders.length - dueOrders.length,
      total: allOrders.length,
    })
  } catch (error) {
    console.error('[TRACK ERROR]', error)
    return NextResponse.json({ error: 'Track failed' }, { status: 500 })
  }
}
