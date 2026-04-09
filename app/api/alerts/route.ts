import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendDelayAlert } from '@/lib/mailer'

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
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
  } catch (error) {
    console.error('[ALERTS ERROR]', error)
    return NextResponse.json({ error: 'Alerts failed' }, { status: 500 })
  }
}
