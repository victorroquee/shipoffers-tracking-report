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
  { countryCode: 'FR', countryName: 'Franca', days: 7 },
  { countryCode: 'PT', countryName: 'Portugal', days: 7 },
  { countryCode: 'SE', countryName: 'Suecia', days: 7 },
  { countryCode: 'DK', countryName: 'Dinamarca', days: 7 },
  { countryCode: 'GB', countryName: 'Reino Unido', days: 7 },
  { countryCode: 'FI', countryName: 'Finlandia', days: 7 },
  { countryCode: 'IT', countryName: 'Italia', days: 7 },
  { countryCode: 'ES', countryName: 'Espanha', days: 7 },
  { countryCode: 'PL', countryName: 'Polonia', days: 7 },
  { countryCode: 'CZ', countryName: 'Republica Tcheca', days: 7 },
  { countryCode: 'HU', countryName: 'Hungria', days: 7 },
  { countryCode: 'NO', countryName: 'Noruega', days: 7 },
  { countryCode: 'US', countryName: 'EUA', days: 7 },
  { countryCode: 'RO', countryName: 'Romenia', days: 7 },
  { countryCode: 'BR', countryName: 'Brasil', days: 7 },
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
