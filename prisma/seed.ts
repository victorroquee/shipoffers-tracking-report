// prisma/seed.ts
// Popula o banco com dados mockados para desenvolvimento
import { PrismaClient } from '@prisma/client'
import { getMockDBOrders } from '../lib/mock-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Populando banco com dados mockados...')

  // Limpa dados existentes
  await prisma.orderEvent.deleteMany()
  await prisma.order.deleteMany()

  const mockOrders = getMockDBOrders()

  for (const mock of mockOrders) {
    const order = await prisma.order.create({
      data: {
        shipofffersId: mock.shipofffersId,
        trackingCode: mock.trackingCode,
        customerName: mock.customerName,
        customerEmail: mock.customerEmail,
        destinationCountry: mock.destinationCountry,
        shippedAt: mock.shippedAt,
        deliveredAt: mock.deliveredAt,
        status: mock.status,
        lastTrackingSync: mock.lastTrackingSync,
        daysInTransit: mock.daysInTransit,
        delayThreshold: mock.delayThreshold,
        isDelayed: mock.isDelayed,
        alertSentAt: mock.alertSentAt,
      },
    })

    // Criar eventos para pedidos atrasados
    if (mock.events?.length) {
      for (const evt of mock.events) {
        await prisma.orderEvent.create({
          data: {
            orderId: order.id,
            status: evt.status,
            description: evt.description,
            occurredAt: evt.occurredAt,
          },
        })
      }
    }
  }

  console.log(`✅ ${mockOrders.length} pedidos criados com sucesso!`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
