import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMockDBOrders } from '@/lib/mock-data'
import { buildDateWhere } from '@/lib/date-filter'

const isMock = process.env.USE_MOCK === 'true'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter')
    const search = searchParams.get('search') ?? ''
    const country = searchParams.get('country') ?? ''
    const countriesOnly = searchParams.get('countries') === 'true'

    const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
    const rawPerPage = parseInt(searchParams.get('per_page') ?? '25', 10)
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage)
    const perPage = Math.min(100, Math.max(1, isNaN(rawPerPage) ? 25 : rawPerPage))

    if (isMock) {
      const allOrders = getMockDBOrders()

      if (countriesOnly) {
        const countries = Array.from(
          new Set(allOrders.map(o => o.destinationCountry).filter(Boolean) as string[])
        ).sort()
        return NextResponse.json({ countries })
      }

      let orders = allOrders
      if (search) {
        const term = search.toLowerCase()
        orders = orders.filter(o =>
          (o.customerName?.toLowerCase().includes(term) ?? false) ||
          (o.trackingCode?.toLowerCase().includes(term) ?? false)
        )
      }
      if (country) orders = orders.filter(o => o.destinationCountry === country)
      if (filter === 'active') orders = orders.filter(o => o.status !== 'DELIVERED')
      if (filter === 'delayed') orders = orders.filter(o => o.isDelayed && o.status !== 'DELIVERED')
      if (filter === 'delivered') orders = orders.filter(o => o.status === 'DELIVERED')

      const total = orders.length
      const paged = orders.slice((page - 1) * perPage, page * perPage)
      return NextResponse.json({ orders: paged, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) })
    }

    if (countriesOnly) {
      const rows = await prisma.order.findMany({
        select: { destinationCountry: true },
        distinct: ['destinationCountry'],
        where: { destinationCountry: { not: null } },
      })
      return NextResponse.json({
        countries: rows.map((r: typeof rows[number]) => r.destinationCountry as string).filter(Boolean).sort(),
      })
    }

    // Cutoff: only May 2026+ orders
    const andClauses: Record<string, unknown>[] = [buildDateWhere()]

    if (search) {
      andClauses.push({
        OR: [
          { trackingCode: { contains: search } },
          { customerName: { contains: search } },
        ],
      })
    }

    if (country) andClauses.push({ destinationCountry: country })

    if (filter === 'active') {
      andClauses.push({ status: { not: 'DELIVERED' } })
    } else if (filter === 'delayed') {
      andClauses.push({ isDelayed: true, status: { not: 'DELIVERED' } })
    } else if (filter === 'ontime') {
      andClauses.push({ isDelayed: false, status: { not: 'DELIVERED' } })
    } else if (filter === 'pending') {
      andClauses.push({ status: 'PENDING' })
    } else if (filter === 'delivered') {
      andClauses.push({ status: 'DELIVERED' })
    }

    const where = { AND: andClauses }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: [{ isDelayed: 'desc' }, { daysSinceOrder: 'desc' }],
        include: {
          events: filter === 'delayed'
            ? { orderBy: { occurredAt: 'desc' }, take: 5 }
            : false,
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])

    return NextResponse.json({ orders, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) })
  } catch (error) {
    console.error('[ORDERS ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
