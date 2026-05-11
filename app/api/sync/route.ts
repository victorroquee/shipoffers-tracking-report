import { prisma } from '@/lib/db'
import { fetchAllOrders, fetchAllShipments, type ShipoffersShipment } from '@/lib/shipoffers'
import { trackPackages } from '@/lib/tracking'
import { getDelayThreshold } from '@/lib/delay-rules'

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Stage 1: Fetch orders and shipments in parallel
    const [orders, shipments] = await Promise.all([
      fetchAllOrders(),
      fetchAllShipments(),
    ])

    console.log(`[SYNC] Fetched ${orders.length} orders, ${shipments.length} shipments`)

    // Stage 2: Build shipment lookup map (order_id -> shipments[])
    const shipmentsByOrderId = new Map<number, ShipoffersShipment[]>()
    for (const shipment of shipments) {
      const existing = shipmentsByOrderId.get(shipment.order_id) ?? []
      existing.push(shipment)
      shipmentsByOrderId.set(shipment.order_id, existing)
    }

    // Upsert each order with correlated shipment data
    for (const order of orders) {
      const orderShipments = shipmentsByOrderId.get(order.id) ?? []
      const firstShipment = orderShipments[0] ?? null

      const trackingCode = firstShipment?.tracking_number ?? null
      const shippedAt = firstShipment?.shipped_at ? new Date(firstShipment.shipped_at) : null
      const daysInTransit = shippedAt
        ? Math.floor((Date.now() - shippedAt.getTime()) / 86400000)
        : null
      const delayThreshold = await getDelayThreshold(order.shipping_address?.country)

      await prisma.order.upsert({
        where: { shipofffersId: String(order.id) },
        create: {
          shipofffersId: String(order.id),
          trackingCode,
          customerName: order.shipping_address?.name ?? null,
          customerEmail: order.email ?? null,
          destinationCountry: order.shipping_address?.country ?? null,
          shippedAt,
          daysInTransit,
          delayThreshold,
          status: 'UNKNOWN',
        },
        update: {
          trackingCode: trackingCode ?? undefined,
          customerName: order.shipping_address?.name ?? undefined,
          customerEmail: order.email ?? undefined,
          destinationCountry: order.shipping_address?.country ?? undefined,
          shippedAt: shippedAt ?? undefined,
          daysInTransit,
          delayThreshold,
        },
      })
    }

    // Stage 3: Track packages via 17track for undelivered orders with tracking codes
    const trackableOrders = await prisma.order.findMany({
      where: {
        trackingCode: { not: null },
        status: { not: 'DELIVERED' },
      },
      select: {
        id: true,
        trackingCode: true,
        daysInTransit: true,
        delayThreshold: true,
      },
    })

    const trackingCodes = trackableOrders
      .map(o => o.trackingCode)
      .filter((code): code is string => code !== null)

    let trackedCount = 0

    if (trackingCodes.length > 0) {
      const trackingResults = await trackPackages(trackingCodes)
      const resultsByCode = new Map(trackingResults.map(r => [r.trackingCode, r]))

      for (const order of trackableOrders) {
        if (!order.trackingCode) continue
        const result = resultsByCode.get(order.trackingCode)
        if (!result) continue

        const isDelayed =
          result.status !== 'DELIVERED' &&
          order.daysInTransit !== null &&
          order.delayThreshold !== null &&
          order.daysInTransit > order.delayThreshold

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: result.status,
            deliveredAt: result.deliveredAt,
            lastTrackingSync: new Date(),
            rawTrackingData: result.rawData,
            isDelayed,
          },
        })
        trackedCount++
      }
    }

    console.log(`[SYNC] Complete — orders: ${orders.length}, shipments: ${shipments.length}, tracked: ${trackedCount}`)

    return Response.json({
      success: true,
      orders: orders.length,
      shipments: shipments.length,
      tracked: trackedCount,
    })
  } catch (error) {
    console.error('[SYNC ERROR]', error)
    return Response.json({ error: 'Sync failed' }, { status: 500 })
  }
}
