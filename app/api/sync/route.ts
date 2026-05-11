import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchAllOrders } from '@/lib/shipoffers'
import { getDelayThreshold } from '@/lib/delay-rules'

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const orders = await fetchAllOrders()

    let synced = 0
    for (const o of orders) {
      // NOTE: ShipoffersOrder uses Swagger field names; full pipeline rewrite in plan 01-02
      // shipped_at is not in the Swagger spec — using created_at as proxy until real field confirmed
      const shippedAt = o.created_at ? new Date(o.created_at) : null
      const daysInTransit = shippedAt
        ? Math.floor((Date.now() - shippedAt.getTime()) / 86400000) : null
      const destinationCountry = o.shipping_address?.country ?? null
      const delayThreshold = getDelayThreshold(destinationCountry)

      await prisma.order.upsert({
        where: { shipofffersId: String(o.id) },
        create: {
          shipofffersId: String(o.id),
          trackingCode: null,
          customerName: o.shipping_address?.name ?? null,
          customerEmail: o.email ?? null,
          destinationCountry,
          shippedAt,
          daysInTransit,
          delayThreshold,
          status: 'UNKNOWN',
        },
        update: {
          customerName: o.shipping_address?.name ?? undefined,
          destinationCountry: destinationCountry ?? undefined,
          shippedAt: shippedAt ?? undefined,
          daysInTransit,
          delayThreshold,
        },
      })
      synced++
    }

    return NextResponse.json({ success: true, total: synced })
  } catch (error) {
    console.error('[SYNC ERROR]', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
