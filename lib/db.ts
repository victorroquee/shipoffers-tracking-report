import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient }

function createPrisma(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    const { Pool } = require('pg') as typeof import('pg')
    const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg')
    const pool = new Pool({ connectionString: dbUrl })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter } as any)
  } else {
    const filePath = dbUrl.replace(/^file:/, '')
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3') as typeof import('@prisma/adapter-better-sqlite3')
    const adapter = new PrismaBetterSqlite3({ url: filePath })
    return new PrismaClient({ adapter } as any)
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma._prisma) {
      globalForPrisma._prisma = createPrisma()
    }
    return (globalForPrisma._prisma as any)[prop]
  },
})
