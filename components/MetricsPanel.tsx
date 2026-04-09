interface CountryAvg {
  country: string
  avgDays: number
  count: number
}

interface MetricsData {
  deliveryRate: number
  avgTransitTime: number | null
  delayed: number
  inTransit: number
  avgByCountry: CountryAvg[]
}

export default function MetricsPanel({ data }: { data: MetricsData }) {
  const kpis = [
    {
      label: 'Taxa de Entrega',
      value: `${data.deliveryRate}%`,
      color: data.deliveryRate >= 90 ? '#0D6330' : data.deliveryRate >= 70 ? '#B45309' : '#C92A2A',
      bg: data.deliveryRate >= 90 ? '#EDFAF3' : data.deliveryRate >= 70 ? '#FFFBEB' : '#FFF0F0',
    },
    {
      label: 'Tempo Medio (dias)',
      value: data.avgTransitTime ?? '—',
      color: '#1D4ED8',
      bg: '#EFF6FF',
    },
    {
      label: 'Total Atrasados',
      value: data.delayed,
      color: '#C92A2A',
      bg: '#FFF0F0',
    },
    {
      label: 'Em Transito',
      value: data.inTransit,
      color: '#0C0E13',
      bg: '#F8F9FB',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: '#FFFFFF',
            border: '1px solid #E5E8EE',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 500, color: '#9299A8', margin: '0 0 10px', letterSpacing: '0.02em' }}>
              {k.label}
            </p>
            <p style={{
              fontSize: '32px', fontWeight: 600,
              color: k.color,
              margin: 0,
              letterSpacing: '-0.6px',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Por país */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E8EE',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0C0E13', margin: '0 0 16px', letterSpacing: '-0.2px' }}>
          Tempo medio em transito por pais — pedidos entregues
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.avgByCountry?.map(c => {
            const pct = Math.min((c.avgDays / 30) * 100, 100)
            const barColor = c.avgDays > 15 ? '#C92A2A' : c.avgDays > 10 ? '#B45309' : '#15803D'
            return (
              <div key={c.country} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: '11px',
                  background: '#F0F2F5', padding: '2px 8px', borderRadius: '4px',
                  color: '#4A5165', fontWeight: 500,
                  width: '44px', textAlign: 'center', flexShrink: 0,
                }}>
                  {c.country}
                </span>
                <div style={{ flex: 1, background: '#F0F2F5', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '6px', borderRadius: '9999px',
                    background: barColor,
                    width: `${pct}%`,
                    transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: '#4A5165', width: '130px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {c.avgDays} dias · {c.count} {c.count === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
            )
          })}
          {(!data.avgByCountry || data.avgByCountry.length === 0) && (
            <p style={{ color: '#9299A8', fontSize: '12px', margin: 0, textAlign: 'center', padding: '24px 0' }}>
              Sem pedidos entregues ainda
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
