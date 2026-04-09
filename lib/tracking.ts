import axios from 'axios'
import { getMockTrackingResults } from './mock-data'

const isMock = process.env.USE_MOCK === 'true'

const client = axios.create({
  baseURL: process.env.SEVENTEENTRACK_API_URL,
  headers: {
    '17token': process.env.SEVENTEENTRACK_API_KEY,
    'Content-Type': 'application/json',
  },
})

export type TrackingStatus =
  | 'PENDING' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY'
  | 'DELIVERED' | 'EXCEPTION' | 'UNKNOWN'

function mapStatus(tag: number): TrackingStatus {
  switch (tag) {
    case 0:  return 'IN_TRANSIT'
    case 10: return 'IN_TRANSIT'
    case 20: return 'OUT_FOR_DELIVERY'
    case 30: return 'DELIVERED'
    case 35: return 'EXCEPTION'
    default: return 'UNKNOWN'
  }
}

export interface TrackingResult {
  trackingCode: string
  status: TrackingStatus
  deliveredAt: Date | null
  rawData: string
}

export async function trackPackages(codes: string[]): Promise<TrackingResult[]> {
  if (!codes.length) return []

  if (isMock) {
    console.log(`[MOCK] Retornando tracking mockado para ${codes.length} códigos`)
    return getMockTrackingResults(codes)
  }

  console.log(`[API] Rastreando ${codes.length} pacotes via 17track...`)

  // 17track aceita até 40 códigos por request
  const chunks: string[][] = []
  for (let i = 0; i < codes.length; i += 40) chunks.push(codes.slice(i, i + 40))

  const results: TrackingResult[] = []

  for (const chunk of chunks) {
    const { data } = await client.post('/gettrackinfo', {
      data: chunk.map(number => ({ number })),
    })

    for (const item of data?.data?.accepted ?? []) {
      const tag = item?.track?.b ?? -1
      const status = mapStatus(tag)
      const latestEvent = (item?.track?.z0 ?? [])[0]
      const deliveredAt = status === 'DELIVERED' && latestEvent?.a
        ? new Date(latestEvent.a) : null

      results.push({
        trackingCode: item.number,
        status,
        deliveredAt,
        rawData: JSON.stringify(item),
      })
    }
  }

  return results
}
