import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { trackPackages } from '@/lib/tracking'

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const orders = await prisma.order.findMany({
      where: {
        trackingCode: { not: null },
        status: { notIn: ['DELIVERED'] },
      },
    })

    const codes = orders.map(o => o.trackingCode!).filter(Boolean)
    const results = await trackPackages(codes)

    let updated = 0
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

      updated++
    }

    return NextResponse.json({ success: true, tracked: updated })
  } catch (error) {
    console.error('[TRACK ERROR]', error)
    return NextResponse.json({ error: 'Track failed' }, { status: 500 })
  }
}
