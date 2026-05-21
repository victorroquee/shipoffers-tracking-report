// Cutoff fixo: apenas pedidos de maio 2026 em diante.
// Pedidos anteriores sao ignorados (dados historicos pre-sistema).

const CUTOFF_DATE = '2026-05-01T00:00:00.000Z'

export function buildDateWhere(): Record<string, unknown> {
  return {
    orderedAt: { gte: new Date(CUTOFF_DATE) },
  }
}
