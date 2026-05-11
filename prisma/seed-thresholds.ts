// prisma/seed-thresholds.ts
// Seeds DelayThreshold table with all countries from DELAY_RULES
// Run: npx tsx prisma/seed-thresholds.ts

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const filePath = dbUrl.replace(/^file:/, '')
const adapter = new PrismaBetterSqlite3({ url: filePath })
const prisma = new PrismaClient({ adapter } as any)

const COUNTRIES: Array<{ countryCode: string; countryName: string; days: number }> = [
  { countryCode: 'DE', countryName: 'Alemanha', days: 7 },
  { countryCode: 'AT', countryName: 'Austria', days: 7 },
  { countryCode: 'CH', countryName: 'Suica', days: 7 },
  { countryCode: 'NL', countryName: 'Holanda', days: 7 },
  { countryCode: 'BE', countryName: 'Belgica', days: 7 },
  { countryCode: 'FR', countryName: 'Franca', days: 10 },
  { countryCode: 'PT', countryName: 'Portugal', days: 10 },
  { countryCode: 'SE', countryName: 'Suecia', days: 10 },
  { countryCode: 'DK', countryName: 'Dinamarca', days: 10 },
  { countryCode: 'GB', countryName: 'Reino Unido', days: 10 },
  { countryCode: 'FI', countryName: 'Finlandia', days: 12 },
  { countryCode: 'IT', countryName: 'Italia', days: 12 },
  { countryCode: 'ES', countryName: 'Espanha', days: 12 },
  { countryCode: 'PL', countryName: 'Polonia', days: 14 },
  { countryCode: 'CZ', countryName: 'Republica Tcheca', days: 14 },
  { countryCode: 'HU', countryName: 'Hungria', days: 14 },
  { countryCode: 'NO', countryName: 'Noruega', days: 14 },
  { countryCode: 'US', countryName: 'EUA', days: 14 },
  { countryCode: 'RO', countryName: 'Romenia', days: 18 },
  { countryCode: 'BR', countryName: 'Brasil', days: 21 },
]

async function main() {
  console.log('Seeding DelayThreshold table...')
  for (const country of COUNTRIES) {
    await prisma.delayThreshold.upsert({
      where: { countryCode: country.countryCode },
      create: country,
      update: { countryName: country.countryName, days: country.days },
    })
  }
  const count = await prisma.delayThreshold.count()
  console.log(`Done. ${count} thresholds in database.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
