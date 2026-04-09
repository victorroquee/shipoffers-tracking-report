import { Package, Truck, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'

interface Order {
  status: string
  isDelayed: boolean
}

interface Stat {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>
  iconColor: string
  iconBg: string
  valueColor: string
  delta?: { text: string; type: 'up' | 'down' | 'warn' }
}

export default function StatsBar({ orders }: { orders: Order[] }) {
  const total = orders.length
  const delivered = orders.filter(o => o.status === 'DELIVERED').length
  const inTransit = orders.filter(o => ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length
  const delayed = orders.filter(o => o.isDelayed && o.status !== 'DELIVERED').length
  const rate = total > 0 ? Math.round((delivered / total) * 100) : 0

  const stats: Stat[] = [
    {
      label: 'Total de Pedidos',
      value: total,
      icon: Package,
      iconColor: '#4A5165',
      iconBg: '#F0F2F5',
      valueColor: '#0C0E13',
    },
    {
      label: 'Em Transito',
      value: inTransit,
      icon: Truck,
      iconColor: '#1D4ED8',
      iconBg: '#EFF6FF',
      valueColor: '#1D4ED8',
    },
    {
      label: 'Entregues',
      value: delivered,
      icon: CheckCircle2,
      iconColor: '#15803D',
      iconBg: '#EDFAF3',
      valueColor: '#0D6330',
    },
    {
      label: 'Em Atraso',
      value: delayed,
      icon: AlertTriangle,
      iconColor: '#C92A2A',
      iconBg: '#FFF0F0',
      valueColor: '#C92A2A',
      delta: delayed > 0 ? { text: 'Requer atenção', type: 'down' } : { text: 'Nenhum atraso', type: 'up' },
    },
    {
      label: 'Taxa de Entrega',
      value: `${rate}%`,
      icon: TrendingUp,
      iconColor: rate >= 90 ? '#15803D' : rate >= 70 ? '#B45309' : '#C92A2A',
      iconBg: rate >= 90 ? '#EDFAF3' : rate >= 70 ? '#FFFBEB' : '#FFF0F0',
      valueColor: rate >= 90 ? '#0D6330' : rate >= 70 ? '#B45309' : '#C92A2A',
      delta: rate >= 90
        ? { text: 'Meta atingida', type: 'up' }
        : rate >= 70
        ? { text: 'Abaixo da meta', type: 'warn' }
        : { text: 'Critico', type: 'down' },
    },
  ]

  const deltaStyle = (type: 'up' | 'down' | 'warn') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 7px',
    borderRadius: '20px',
    background: type === 'up' ? '#EDFAF3' : type === 'warn' ? '#FFFBEB' : '#FFF0F0',
    color: type === 'up' ? '#0D5C2E' : type === 'warn' ? '#B45309' : '#C92A2A',
  } as React.CSSProperties)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: '#FFFFFF',
          border: '1px solid #E5E8EE',
          borderRadius: '12px',
          padding: '14px 16px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#9299A8', letterSpacing: '0.02em' }}>
              {s.label}
            </span>
            <div style={{
              width: '28px', height: '28px',
              borderRadius: '8px',
              background: s.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <s.icon size={14} strokeWidth={1.4} style={{ color: s.iconColor }} />
            </div>
          </div>
          <div style={{
            fontSize: '26px', fontWeight: 600,
            color: s.valueColor,
            letterSpacing: '-0.6px',
            lineHeight: 1,
            marginBottom: '8px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {s.value}
          </div>
          {s.delta && (
            <span style={deltaStyle(s.delta.type)}>{s.delta.text}</span>
          )}
        </div>
      ))}
    </div>
  )
}
