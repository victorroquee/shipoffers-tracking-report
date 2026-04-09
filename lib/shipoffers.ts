import axios from 'axios'
import { getMockOrders, type MockOrder } from './mock-data'

const isMock = process.env.USE_MOCK === 'true'

const client = axios.create({
  baseURL: process.env.SHIPOFFERS_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.SHIPOFFERS_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

export interface ShipoffersOrder {
  id: string
  tracking_code?: string
  customer_name?: string
  customer_email?: string
  destination_country?: string
  shipped_at?: string
  status?: string
}

export async function fetchAllOrders(): Promise<ShipoffersOrder[]> {
  if (isMock) {
    console.log('[MOCK] Retornando pedidos mockados da Shipoffers')
    return getMockOrders()
  }

  console.log('[API] Buscando pedidos reais da Shipoffers...')
  const all: ShipoffersOrder[] = []
  let page = 1
  const limit = 100

  while (true) {
    const { data } = await client.get('/orders', { params: { page, limit } })
    const orders: ShipoffersOrder[] = data?.orders ?? data?.data ?? data ?? []
    if (!orders.length) break
    all.push(...orders)
    if (orders.length < limit) break
    page++
  }

  return all
}
