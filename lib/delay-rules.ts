// lib/delay-rules.ts
// Delay threshold per country. Reads from DB first, falls back to hardcoded defaults.
// Countdown starts from orderedAt (order date), not ship date.

import { prisma } from './db'

const DELAY_RULES: Record<string, number> = {
  DE: 7, FR: 7, NL: 7, BE: 7, AT: 7, IT: 8, ES: 8, PT: 10,
  PL: 10, CZ: 10, HU: 10, SE: 10, DK: 8, FI: 12, NO: 12,
  CH: 8, GB: 10, US: 14, BR: 21, RO: 12,
  DEFAULT: 7,
}

export async function getDelayThreshold(countryCode: string | null | undefined): Promise<number> {
  const code = countryCode?.toUpperCase() ?? ''
  try {
    if (code) {
      const record = await prisma.delayThreshold.findUnique({ where: { countryCode: code } })
      if (record) return record.days
    }
  } catch {
    // DB unavailable (mock mode, cold start) — fall through to hardcoded
  }
  return DELAY_RULES[code] ?? DELAY_RULES.DEFAULT
}

export function getDelayThresholdSync(countryCode: string | null | undefined): number {
  const code = countryCode?.toUpperCase() ?? ''
  return DELAY_RULES[code] ?? DELAY_RULES.DEFAULT
}
