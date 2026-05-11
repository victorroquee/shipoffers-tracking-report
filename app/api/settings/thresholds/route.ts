import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const isMock = process.env.USE_MOCK === 'true'

// Fallback mock data in case DB is unavailable in mock mode
const MOCK_THRESHOLDS = [
  { countryCode: 'AT', countryName: 'Austria', days: 7 },
  { countryCode: 'BE', countryName: 'Belgica', days: 7 },
  { countryCode: 'BR', countryName: 'Brasil', days: 21 },
  { countryCode: 'CH', countryName: 'Suica', days: 7 },
  { countryCode: 'CZ', countryName: 'Republica Tcheca', days: 14 },
  { countryCode: 'DE', countryName: 'Alemanha', days: 7 },
  { countryCode: 'DK', countryName: 'Dinamarca', days: 10 },
  { countryCode: 'ES', countryName: 'Espanha', days: 12 },
  { countryCode: 'FI', countryName: 'Finlandia', days: 12 },
  { countryCode: 'FR', countryName: 'Franca', days: 10 },
  { countryCode: 'GB', countryName: 'Reino Unido', days: 10 },
  { countryCode: 'HU', countryName: 'Hungria', days: 14 },
  { countryCode: 'IT', countryName: 'Italia', days: 12 },
  { countryCode: 'NL', countryName: 'Holanda', days: 7 },
  { countryCode: 'NO', countryName: 'Noruega', days: 14 },
  { countryCode: 'PL', countryName: 'Polonia', days: 14 },
  { countryCode: 'PT', countryName: 'Portugal', days: 10 },
  { countryCode: 'RO', countryName: 'Romenia', days: 18 },
  { countryCode: 'SE', countryName: 'Suecia', days: 10 },
  { countryCode: 'US', countryName: 'EUA', days: 14 },
]

export async function GET() {
  try {
    if (isMock) {
      return NextResponse.json(MOCK_THRESHOLDS)
    }

    const thresholds = await prisma.delayThreshold.findMany({
      orderBy: { countryName: 'asc' },
    })

    return NextResponse.json(thresholds)
  } catch (error) {
    console.error('[THRESHOLDS GET ERROR]', error)
    return NextResponse.json({ error: 'Falha ao buscar thresholds' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (isMock) {
      return NextResponse.json(
        { error: 'Configuracao nao disponivel em modo mock' },
        { status: 501 }
      )
    }

    const body = await req.json()
    const { countryCode, days } = body

    // Validate input
    if (!countryCode || typeof countryCode !== 'string') {
      return NextResponse.json({ error: 'countryCode invalido' }, { status: 400 })
    }

    if (
      typeof days !== 'number' ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 365
    ) {
      return NextResponse.json(
        { error: 'days deve ser um numero inteiro entre 1 e 365' },
        { status: 400 }
      )
    }

    // Check if country exists
    const existing = await prisma.delayThreshold.findUnique({
      where: { countryCode },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Pais nao encontrado' }, { status: 404 })
    }

    const updated = await prisma.delayThreshold.update({
      where: { countryCode },
      data: { days },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[THRESHOLDS PUT ERROR]', error)
    return NextResponse.json({ error: 'Falha ao atualizar threshold' }, { status: 500 })
  }
}
