import { prisma } from '@/lib/db'
import { fetchAllOrders } from '@/lib/shipoffers'
import { registerTrackingCodes, trackPackages } from '@/lib/tracking'
import { getDelayThreshold } from '@/lib/delay-rules'
import { STATUS_RANK, REGISTER_BUDGET, POLLING_INTERVALS } from '@/lib/constants'

/**
 * Returns the polling interval in milliseconds for a given transit age.
 * Newer orders are polled less frequently (too early for updates).
 */
function getPollingInterval(daysInTransit: number | null): number {
  const days = daysInTransit ?? 0
  for (const rule of POLLING_INTERVALS) {
    if (days <= rule.maxDays) return rule.intervalHours * 60 * 60 * 1000
  }
  return 7 * 24 * 60 * 60 * 1000 // fallback: weekly
}

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Stage 1: Fetch orders from last 7 days
    const since = new Date()
    since.setDate(since.getDate() - 7)
    const orders = await fetchAllOrders({ updated_at_start: since.toISOString() })

    console.log(`[SYNC] Fetched ${orders.length} orders`)

    // Stage 2: Upsert each order with embedded shipment data
    // BUSINESS RULE: The delay countdown starts from the ORDER date, not the ship date.
    // A customer waiting 5 days for shipment already consumed 5 days of the threshold.
    for (const order of orders) {
      const firstShipment = order.shipments[0] ?? null

      const trackingCode = firstShipment?.tracking_number ?? null
      const shippedAt = firstShipment?.ship_date ? new Date(firstShipment.ship_date) : null
      // Order date: use ordered_at/created_at from Shipoffers, ship_date, or today as fallback
      // Every order MUST have orderedAt so date filters work reliably
      // Normalize to midnight UTC to avoid SQLite adapter date comparison issues
      const rawOrderedAt = order.ordered_at ? new Date(order.ordered_at)
        : order.created_at ? new Date(order.created_at)
        : shippedAt ?? new Date()
      const orderedAt = new Date(rawOrderedAt.toISOString().split('T')[0] + 'T00:00:00.000Z')

      const daysSinceOrder = orderedAt
        ? Math.floor((Date.now() - orderedAt.getTime()) / 86400000)
        : null
      const daysInTransit = shippedAt
        ? Math.floor((Date.now() - shippedAt.getTime()) / 86400000)
        : null

      const delayThreshold = await getDelayThreshold(order.country)
      const status = order.status === 'shipped' ? 'IN_TRANSIT'
        : order.status === 'cancelled' ? 'EXCEPTION'
        : ['pending_shipment', 'pending_fulfillment'].includes(order.status) ? 'PENDING'
        : !trackingCode && !shippedAt ? 'PENDING'
        : 'UNKNOWN'

      // Delay is based on days since ORDER (not since shipment)
      const isDelayed =
        daysSinceOrder !== null &&
        delayThreshold !== null &&
        daysSinceOrder > delayThreshold

      await prisma.order.upsert({
        where: { shipofffersId: order.id },
        create: {
          shipofffersId: order.id,
          trackingCode,
          customerName: order.ship_name || null,
          customerEmail: null,
          destinationCountry: order.country || null,
          orderedAt,
          shippedAt,
          daysSinceOrder,
          daysInTransit,
          delayThreshold,
          isDelayed,
          status,
        },
        update: {
          trackingCode: trackingCode ?? undefined,
          customerName: order.ship_name || undefined,
          destinationCountry: order.country || undefined,
          orderedAt: orderedAt ?? undefined,
          shippedAt: shippedAt ?? undefined,
          daysSinceOrder,
          daysInTransit,
          delayThreshold,
          isDelayed,
        },
      })
    }

    // Stage 3a: Register NEW tracking codes (costs 1 credit each — the only paid call)
    // Skip DELIVERED — they're archived and don't need tracking
    const newOrders = await prisma.order.findMany({
      where: {
        trackingCode: { not: null },
        lastTrackingSync: null,
        status: { not: 'DELIVERED' },
      },
      select: { trackingCode: true, destinationCountry: true },
    })
    const newCodes = newOrders
      .filter((o: typeof newOrders[number]) => o.trackingCode !== null)
      .map((o: typeof newOrders[number]) => ({
        number: o.trackingCode as string,
        country: o.destinationCountry,
      }))
      .slice(0, REGISTER_BUDGET)

    let registeredCount = 0
    if (newCodes.length > 0) {
      registeredCount = await registerTrackingCodes(newCodes)
    }

    // Stage 3b: Smart polling — gettrackinfo is FREE, but we skip orders that
    // were checked recently based on their transit age
    const allTrackable = await prisma.order.findMany({
      where: {
        trackingCode: { not: null },
        status: { not: 'DELIVERED' },
      },
      select: {
        id: true,
        trackingCode: true,
        daysSinceOrder: true,
        daysInTransit: true,
        delayThreshold: true,
        status: true,
        lastTrackingSync: true,
      },
      orderBy: [
        { lastTrackingSync: { sort: 'asc', nulls: 'first' } },
      ],
    })

    // Filter: only query orders whose polling interval has elapsed
    const now = Date.now()
    const dueForTracking = allTrackable.filter(order => {
      if (!order.lastTrackingSync) return true // never synced
      const interval = getPollingInterval(order.daysInTransit)
      return now - order.lastTrackingSync.getTime() >= interval
    })

    const trackingCodes = dueForTracking
      .map((o: typeof dueForTracking[number]) => o.trackingCode)
      .filter((code: string | null): code is string => code !== null)

    let trackedCount = 0
    const skippedCount = allTrackable.length - dueForTracking.length

    if (trackingCodes.length > 0) {
      const trackingResults = await trackPackages(trackingCodes)
      const resultsByCode = new Map(trackingResults.map((r: typeof trackingResults[number]) => [r.trackingCode, r]))

      for (const order of dueForTracking) {
        if (!order.trackingCode) continue
        const result = resultsByCode.get(order.trackingCode)
        if (!result) continue

        const currentRank = STATUS_RANK[order.status] ?? 0
        const newRank = STATUS_RANK[result.status] ?? 0
        const effectiveStatus = newRank >= currentRank ? result.status : order.status

        // Business rule: delay countdown from ORDER date, not ship date
        const threshold = order.delayThreshold ?? 7
        const isDelayed =
          effectiveStatus !== 'DELIVERED' &&
          order.daysSinceOrder !== null &&
          order.daysSinceOrder > threshold

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: effectiveStatus,
            deliveredAt: result.deliveredAt,
            lastTrackingSync: new Date(),
            rawTrackingData: result.rawData,
            isDelayed,
          },
        })
        trackedCount++
      }
    }

    console.log(`[SYNC] Complete — orders: ${orders.length}, registered: ${registeredCount} (credits), tracked: ${trackedCount} (free), skipped: ${skippedCount} (not due)`)

    return Response.json({
      success: true,
      orders: orders.length,
      registered: registeredCount,
      tracked: trackedCount,
      skipped: skippedCount,
      creditsUsed: registeredCount,
    })
  } catch (error) {
    console.error('[SYNC ERROR]', error)
    return Response.json({ error: 'Sync failed' }, { status: 500 })
  }
}
