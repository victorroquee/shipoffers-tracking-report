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
  FR: 10,  // França
  PT: 10,  // Portugal
  SE: 10,  // Suécia
  DK: 10,  // Dinamarca
  GB: 10,  // Reino Unido
  FI: 12,  // Finlândia
  IT: 12,  // Itália
  ES: 12,  // Espanha
  PL: 14,  // Polônia
  CZ: 14,  // República Tcheca
  HU: 14,  // Hungria
  NO: 14,  // Noruega
  US: 14,  // EUA
  RO: 18,  // Romênia
  BR: 21,  // Brasil
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
