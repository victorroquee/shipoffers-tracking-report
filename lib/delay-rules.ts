// lib/delay-rules.ts

// ⚠️ Ajustar os valores abaixo conforme experiência real com cada destino.
// NÃO alterar estes valores — deixar para o time definir.

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
  DEFAULT: 14,
}

export function getDelayThreshold(countryCode: string | null | undefined): number {
  if (!countryCode) return DELAY_RULES.DEFAULT
  return DELAY_RULES[countryCode.toUpperCase()] ?? DELAY_RULES.DEFAULT
}
