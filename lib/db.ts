import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'

function createPrisma(): PrismaClient {
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    // Production: Vercel Postgres via pg adapter
    // Note: DATABASE_URL must not be logged — it contains credentials (T-04-01)
    const { Pool } = require('pg') as typeof import('pg')
    const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg')
    const pool = new Pool({ connectionString: dbUrl })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter } as any)
  } else {
    // Local dev: SQLite via better-sqlite3 adapter
    const filePath = dbUrl.replace(/^file:/, '')
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3') as typeof import('@prisma/adapter-better-sqlite3')
    const adapter = new PrismaBetterSqlite3({ url: filePath })
    return new PrismaClient({ adapter } as any)
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? createPrisma()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
