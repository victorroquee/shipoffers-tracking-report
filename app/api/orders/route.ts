import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMockDBOrders } from '@/lib/mock-data'

const isMock = process.env.USE_MOCK === 'true'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter')

    // Em modo mock, retorna dados sem precisar do banco
    if (isMock) {
      let orders = getMockDBOrders()
      if (filter === 'delayed') orders = orders.filter(o => o.isDelayed && o.status !== 'DELIVERED')
      if (filter === 'delivered') orders = orders.filter(o => o.status === 'DELIVERED')
      return NextResponse.json(orders)
    }

    const where: Record<string, unknown> = {}
    if (filter === 'delayed') {
      where.isDelayed = true
      where.status = { not: 'DELIVERED' }
    }
    if (filter === 'delivered') where.status = 'DELIVERED'

    const orders = await prisma.order.findMany({
      where,
      orderBy: [{ isDelayed: 'desc' }, { daysInTransit: 'desc' }],
      include: {
        events: filter === 'delayed'
          ? { orderBy: { occurredAt: 'desc' }, take: 5 }
          : false,
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('[ORDERS ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
