import axios from 'axios'
import { getMockOrders, type MockOrder } from './mock-data'

// Re-export MockOrder as ShipoffersOrder for mock fallback compatibility
export type { MockOrder }

// Mock mode detection: explicit flag OR missing credentials (per D-10)
function shouldUseMock(): boolean {
  if (process.env.USE_MOCK === 'true') {
    console.log('[MOCK] USE_MOCK=true')
    return true
  }
  if (!process.env.SHIPOFFERS_API_USER || !process.env.SHIPOFFERS_API_PASS) {
    console.log('[MOCK] Shipoffers credentials not configured')
    return true
  }
  return false
}

// Build Basic Auth header (per D-01)
function buildAuthHeader(): string {
  const user = process.env.SHIPOFFERS_API_USER ?? ''
  const pass = process.env.SHIPOFFERS_API_PASS ?? ''
  const encoded = Buffer.from(`${user}:${pass}`).toString('base64')
  return `Basic ${encoded}`
}

// Axios client with Basic Auth (per D-01)
const client = axios.create({
  baseURL: process.env.SHIPOFFERS_API_URL ?? 'https://api.shipoffers.com',
  headers: {
    'Authorization': buildAuthHeader(),
    'Content-Type': 'application/json',
  },
})

// Exported interfaces (field names based on Swagger — confirmed when API responds)
export interface ShipoffersOrder {
  id: number
  order_number: string
  email: string
  shipping_address: {
    name?: string
    country?: string
    city?: string
    address1?: string
    address2?: string
    zip?: string
    province?: string
  }
  created_at: string
  updated_at: string
  status: string
}

export interface ShipoffersShipment {
  id: number
  order_id: number
  tracking_number: string
  carrier: string
  shipped_at: string
  created_at: string
  updated_at: string
}

export interface FetchParams {
  updated_at_start?: string
  updated_at_end?: string
  order_number?: string
  email?: string
}

/**
 * Fetch all orders from /api/stores/{store_id}/orders.json with pagination (per D-05).
 * Falls back to mock data when credentials are missing or USE_MOCK=true (per D-10).
 */
export async function fetchAllOrders(params?: FetchParams): Promise<ShipoffersOrder[]> {
  if (shouldUseMock()) {
    return getMockOrders() as unknown as ShipoffersOrder[]
  }

  const storeId = process.env.SHIPOFFERS_STORE_ID
  const all: ShipoffersOrder[] = []
  let page = 1
  const per_page = 250

  console.log('[API] Buscando pedidos reais da Shipoffers...')

  while (true) {
    const { data } = await client.get<ShipoffersOrder[]>(
      `/api/stores/${storeId}/orders.json`,
      { params: { page, per_page, ...params } }
    )
    const orders: ShipoffersOrder[] = Array.isArray(data) ? data : []
    if (!orders.length) break
    all.push(...orders)
    if (orders.length < per_page) break
    page++
  }

  return all
}

/**
 * Fetch all shipments from /api/stores/{store_id}/shipments.json with pagination (per D-06).
 * Falls back to mock data when credentials are missing or USE_MOCK=true (per D-10).
 */
export async function fetchAllShipments(params?: FetchParams): Promise<ShipoffersShipment[]> {
  if (shouldUseMock()) {
    console.log('[MOCK] Retornando shipments mockados (nenhum no mock-data)')
    return []
  }

  const storeId = process.env.SHIPOFFERS_STORE_ID
  const all: ShipoffersShipment[] = []
  let page = 1
  const per_page = 250

  console.log('[API] Buscando shipments reais da Shipoffers...')

  while (true) {
    const { data } = await client.get<ShipoffersShipment[]>(
      `/api/stores/${storeId}/shipments.json`,
      { params: { page, per_page, ...params } }
    )
    const shipments: ShipoffersShipment[] = Array.isArray(data) ? data : []
    if (!shipments.length) break
    all.push(...shipments)
    if (shipments.length < per_page) break
    page++
  }

  return all
}

/**
 * Fetch shipments for a single order from /api/stores/{store_id}/orders/{order_id}/shipments.json (per D-07).
 */
export async function fetchOrderShipments(orderId: number): Promise<ShipoffersShipment[]> {
  if (shouldUseMock()) {
    console.log('[MOCK] Retornando order shipments mockados')
    return []
  }

  const storeId = process.env.SHIPOFFERS_STORE_ID
  console.log(`[API] Buscando shipments do pedido ${orderId}...`)

  const { data } = await client.get<ShipoffersShipment[]>(
    `/api/stores/${storeId}/orders/${orderId}/shipments.json`
  )
  return Array.isArray(data) ? data : []
}
