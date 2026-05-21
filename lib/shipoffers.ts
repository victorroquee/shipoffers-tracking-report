import axios from 'axios'
import { getMockOrders } from './mock-data'

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

// Build Axios client lazily so env vars are available at call time
function getClient() {
  const user = process.env.SHIPOFFERS_API_USER ?? ''
  const pass = process.env.SHIPOFFERS_API_PASS ?? ''
  const encoded = Buffer.from(`${user}:${pass}`).toString('base64')
  return axios.create({
    baseURL: process.env.SHIPOFFERS_API_URL ?? 'https://api.shipoffers.com',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
  })
}

// --- Real API response types (confirmed 2026-05-12) ---

export interface ShipoffersShipment {
  id: string
  order_number: string
  tracking_number: string | null
  ship_name: string
  address1: string
  address2: string
  city: string
  state: string
  postal_code: string
  country: string
  status: string
  carrier_code: string | null
  service_code: string | null
  ship_date: string | null
}

export interface ShipoffersOrder {
  id: string
  status: string
  order_number: string
  ship_name: string
  address1: string
  address2: string
  city: string
  state: string
  postal_code: string
  country: string
  ordered_at?: string | null   // When the customer placed the order
  created_at?: string | null   // When the order was created in Shipoffers
  shipments: ShipoffersShipment[]
  items: Array<{ id: string; sku_id: number; quantity: number; sku: string }>
}

interface OrdersApiResponse {
  total: number
  pages: number
  orders: ShipoffersOrder[]
}

export interface FetchParams {
  updated_at_start?: string
  updated_at_end?: string
  order_number?: string
}

// Convert flat MockOrder fields to ShipoffersOrder shape for mock consistency
function mockOrdersToShipoffersOrders(): ShipoffersOrder[] {
  return getMockOrders().map((o, i) => ({
    id: `mock-${i + 10001}`,
    status: o.status ?? 'shipped',
    order_number: o.id ?? `SO-${10001 + i}`,
    ship_name: o.customer_name ?? '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    country: o.destination_country ?? '',
    shipments: o.tracking_code
      ? [{
          id: `mock-ship-${i}`,
          order_number: o.id ?? `SO-${10001 + i}`,
          tracking_number: o.tracking_code,
          ship_name: o.customer_name ?? '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          postal_code: '',
          country: o.destination_country ?? '',
          status: 'shipped',
          carrier_code: null,
          service_code: null,
          ship_date: o.shipped_at ?? null,
        }]
      : [],
    items: [],
  }))
}

/**
 * Fetch all orders from /api/stores/{store_id}/orders.json with pagination.
 * Response shape: { total, pages, orders: [...] } — shipments are embedded in each order.
 * Falls back to mock data when credentials are missing or USE_MOCK=true.
 */
export async function fetchAllOrders(params?: FetchParams): Promise<ShipoffersOrder[]> {
  if (shouldUseMock()) {
    return mockOrdersToShipoffersOrders()
  }

  const storeId = process.env.SHIPOFFERS_STORE_ID
  const client = getClient()
  const all: ShipoffersOrder[] = []
  let page = 1
  const per_page = 250

  console.log('[API] Buscando pedidos reais da Shipoffers...')

  while (true) {
    const { data } = await client.get<OrdersApiResponse>(
      `/api/stores/${storeId}/orders.json`,
      { params: { page, per_page, ...params } }
    )
    const orders = data?.orders ?? []
    if (!orders.length) break
    all.push(...orders)
    if (orders.length < per_page) break
    page++
  }

  console.log(`[API] Total de pedidos obtidos: ${all.length}`)
  return all
}

/**
 * Fetch shipments for a single order from /api/stores/{store_id}/orders/{order_id}/shipments.json.
 */
export async function fetchOrderShipments(orderId: string): Promise<ShipoffersShipment[]> {
  if (shouldUseMock()) {
    console.log('[MOCK] Retornando order shipments mockados')
    const mockOrders = mockOrdersToShipoffersOrders()
    const order = mockOrders.find(o => o.id === orderId)
    return order?.shipments ?? []
  }

  const storeId = process.env.SHIPOFFERS_STORE_ID
  const client = getClient()
  console.log(`[API] Buscando shipments do pedido ${orderId}...`)

  const { data } = await client.get<ShipoffersShipment[]>(
    `/api/stores/${storeId}/orders/${orderId}/shipments.json`
  )
  return Array.isArray(data) ? data : []
}
