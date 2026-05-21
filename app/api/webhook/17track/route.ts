import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { STATUS_RANK } from '@/lib/constants'
import crypto from 'crypto'

/**
 * 17track webhook endpoint — receives push notifications when tracking status changes.
 * FREE — no quota cost. Configure the webhook URL in 17track dashboard (Api-settings).
 *
 * Security: Validates X-Signature-SHA256 = SHA256(rawBody + SEVENTEENTRACK_WEBHOOK_SECRET)
 *
 * To enable: Set SEVENTEENTRACK_WEBHOOK_SECRET in .env.local and configure the URL
 * in 17track dashboard pointing to https://your-domain.com/api/webhook/17track
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const secret = process.env.SEVENTEENTRACK_WEBHOOK_SECRET

    // Reject unauthenticated requests when secret is not configured
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Validate signature with timing-safe comparison
    const signature = req.headers.get('x-signature-sha256') ?? ''
    const expected = crypto.createHash('sha256').update(rawBody + secret).digest('hex')
    const sigBuf = Buffer.from(signature, 'utf-8')
    const expBuf = Buffer.from(expected, 'utf-8')
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn('[WEBHOOK] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const items = body?.data?.accepted ?? body?.data ?? []

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    let updated = 0

    for (const item of items) {
      const trackingCode = item.number
      if (!trackingCode) continue

      const order = await prisma.order.findFirst({
        where: { trackingCode },
      })
      if (!order) continue

      const latestStatus = item?.track_info?.latest_status?.status ?? 'NotFound'
      const statusMap: Record<string, string> = {
        InTransit: 'IN_TRANSIT', OutForDelivery: 'OUT_FOR_DELIVERY',
        Delivered: 'DELIVERED', Exception: 'EXCEPTION',
        AvailableForPickup: 'EXCEPTION', Expired: 'EXCEPTION',
        InfoReceived: 'PENDING', PickedUp: 'PENDING',
        NotFound: 'UNKNOWN',
      }
      const newStatus = statusMap[latestStatus] ?? 'UNKNOWN'

      const currentRank = STATUS_RANK[order.status] ?? 0
      const newRank = STATUS_RANK[newStatus] ?? 0
      const effectiveStatus = newRank >= currentRank ? newStatus : order.status

      const latestEvent = item?.track_info?.latest_event
      const deliveredAt = effectiveStatus === 'DELIVERED' && latestEvent?.time_iso
        ? new Date(latestEvent.time_iso) : null

      // Delay countdown from order date, not ship date
      const orderDate = order.orderedAt ?? order.shippedAt
      const daysSinceOrder = orderDate
        ? Math.floor((Date.now() - orderDate.getTime()) / 86400000) : null
      const isDelayed =
        effectiveStatus !== 'DELIVERED' &&
        daysSinceOrder !== null &&
        order.delayThreshold !== null &&
        daysSinceOrder > order.delayThreshold

      const nowDate = new Date()
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: effectiveStatus,
          deliveredAt,
          daysSinceOrder,
          lastTrackingSync: nowDate,
          rawTrackingData: JSON.stringify(item),
          isDelayed,
        },
      })

      if (isDelayed && !order.isDelayed) {
        await prisma.orderEvent.create({
          data: {
            orderId: order.id,
            status: effectiveStatus,
            description: `Webhook: dia ${daysSinceOrder} desde pedido (limite: ${order.delayThreshold ?? '?'} dias)`,
            occurredAt: nowDate,
          },
        })
      }

      updated++
    }

    console.log(`[WEBHOOK] Processed ${updated} tracking updates`)
    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
