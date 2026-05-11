// lib/delay-rules.ts

// ⚠️ Ajustar os valores abaixo conforme experiência real com cada destino.
// NÃO alterar estes valores diretamente — usar a interface de configurações.

import { prisma } from '@/lib/db'

const DELAY_RULES: Record<string, number> = {
  DE: 7,   // Alemanha
  AT: 7,   // Áustria
  CH: 7,   // Suíça
  NL: 7,   // Holanda
  BE: 7,   // Bélgica
  FR: 7,   // França
  PT: 7,   // Portugal
  SE: 7,   // Suécia
  DK: 7,   // Dinamarca
  GB: 7,   // Reino Unido
  FI: 7,   // Finlândia
  IT: 7,   // Itália
  ES: 7,   // Espanha
  PL: 7,   // Polônia
  CZ: 7,   // República Tcheca
  HU: 7,   // Hungria
  NO: 7,   // Noruega
  US: 7,   // EUA
  RO: 7,   // Romênia
  BR: 7,   // Brasil
  DEFAULT: 7,
}

/**
 * Returns the delay threshold for a country code.
 * Reads from the database first; falls back to hardcoded DELAY_RULES if DB is unavailable.
 */
export async function getDelayThreshold(countryCode: string | null | undefined): Promise<number> {
  const code = countryCode?.toUpperCase()
  if (!code) return DELAY_RULES.DEFAULT

  try {
    const record = await prisma.delayThreshold.findUnique({
      where: { countryCode: code },
    })
    if (record) return record.days
  } catch {
    // DB unavailable or in mock mode — fall back to hardcoded values
  }

  return DELAY_RULES[code] ?? DELAY_RULES.DEFAULT
}

/**
 * Synchronous version that reads only from hardcoded DELAY_RULES.
 * Use this for callers that cannot await (e.g. mock-data.ts).
 */
export function getDelayThresholdSync(countryCode: string | null | undefined): number {
  if (!countryCode) return DELAY_RULES.DEFAULT
  return DELAY_RULES[countryCode.toUpperCase()] ?? DELAY_RULES.DEFAULT
}
