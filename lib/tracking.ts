import axios from 'axios'
import { getMockTrackingResults } from './mock-data'
import { TRACK_BATCH_SIZE } from '@/lib/constants'
import type { TrackingStatus } from '@/lib/constants'

const isMock = process.env.USE_MOCK === 'true'

function getClient() {
  return axios.create({
    baseURL: process.env.SEVENTEENTRACK_API_URL ?? 'https://api.17track.net/track/v2',
    headers: {
      '17token': process.env.SEVENTEENTRACK_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
  })
}

function mapStatus(status: string): TrackingStatus {
  switch (status) {
    case 'InTransit':      return 'IN_TRANSIT'
    case 'OutForDelivery': return 'OUT_FOR_DELIVERY'
    case 'Delivered':      return 'DELIVERED'
    case 'Exception':
    case 'AvailableForPickup':
    case 'Expired':        return 'EXCEPTION'
    case 'InfoReceived':
    case 'PickedUp':       return 'PENDING'
    case 'NotFound':       return 'UNKNOWN'
    default:               return 'UNKNOWN'
  }
}

export interface TrackingResult {
  trackingCode: string
  status: TrackingStatus
  deliveredAt: Date | null
  rawData: string
}

export interface TrackingCodeWithCountry {
  number: string
  country?: string | null
}

/**
 * Register new tracking numbers with 17track.
 * Only call this for codes not yet registered (no lastTrackingSync).
 * COSTS 1 QUOTA PER CODE — this is the only endpoint that costs credits.
 */
export async function registerTrackingCodes(codes: TrackingCodeWithCountry[]): Promise<number> {
  if (!codes.length || isMock) return 0

  const client = getClient()
  let registered = 0

  const chunks: TrackingCodeWithCountry[][] = []
  for (let i = 0; i < codes.length; i += TRACK_BATCH_SIZE) chunks.push(codes.slice(i, i + TRACK_BATCH_SIZE))

  for (const chunk of chunks) {
    try {
      const payload = chunk.map(c => ({
        number: c.number,
        ...(c.country ? { param: c.country } : {}),
      }))
      const { data } = await client.post('/register', payload)
      const accepted = data?.data?.accepted?.length ?? 0
      registered += accepted
      const rejected = data?.data?.rejected ?? []
      if (rejected.length > 0) {
        console.warn(`[17TRACK] Register rejected ${rejected.length} codes. First error:`, rejected[0]?.error?.message)
      }
    } catch (err) {
      console.error(`[17TRACK] Register error:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`[17TRACK] Registered ${registered}/${codes.length} new tracking codes`)
  return registered
}

/**
 * Get tracking info for already-registered codes.
 * FREE — 0 quota cost. Safe to call as often as needed.
 */
export async function trackPackages(codes: string[]): Promise<TrackingResult[]> {
  if (!codes.length) return []

  if (isMock) {
    console.log(`[MOCK] Retornando tracking mockado para ${codes.length} codigos`)
    return getMockTrackingResults(codes)
  }

  console.log(`[17TRACK] Querying ${codes.length} tracking codes (free)...`)

  const client = getClient()
  const chunks: string[][] = []
  for (let i = 0; i < codes.length; i += TRACK_BATCH_SIZE) chunks.push(codes.slice(i, i + TRACK_BATCH_SIZE))

  const results: TrackingResult[] = []

  for (const chunk of chunks) {
    try {
      const { data } = await client.post('/gettrackinfo', chunk.map(number => ({ number })))

      for (const item of data?.data?.accepted ?? []) {
        const latestStatus = item?.track_info?.latest_status?.status ?? 'NotFound'
        const status = mapStatus(latestStatus)
        const latestEvent = item?.track_info?.latest_event
        const deliveredAt = status === 'DELIVERED' && latestEvent?.time_iso
          ? new Date(latestEvent.time_iso) : null

        results.push({
          trackingCode: item.number,
          status,
          deliveredAt,
          rawData: JSON.stringify(item),
        })
      }
    } catch (err) {
      console.error(`[17TRACK] Query error:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`[17TRACK] Got ${results.length} results`)
  return results
}
