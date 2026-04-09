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
      synced++
    }

    return NextResponse.json({ success: true, total: synced })
  } catch (error) {
    console.error('[SYNC ERROR]', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
