'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle, SlidersHorizontal, BarChart2, Wifi } from 'lucide-react'
import OrdersTable from '@/components/OrdersTable'
import StatsBar from '@/components/StatsBar'
import SyncButton from '@/components/SyncButton'

type FilterType = 'all' | 'delayed' | 'delivered'
const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'delayed', label: 'Em Atraso' },
  { key: 'delivered', label: 'Entregues' },
]

export default function HomePage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders${filter !== 'all' ? `?filter=${filter}` : ''}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const delayed = orders.filter(o => o.isDelayed && o.status !== 'DELIVERED').length

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <style>{`
        .og-header { padding: 0 24px; }
        .og-main { padding: 20px 24px; }
        .og-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .og-hide-sm { display: flex; }
        .og-show-sm { display: none; }
        .og-metrics-link::after { content: 'Metricas'; margin-left: 4px; }
        @media (max-width: 768px) {
          .og-header { padding: 0 14px; }
          .og-main { padding: 12px 14px; }
          .og-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .og-hide-sm { display: none !important; }
          .og-show-sm { display: flex !important; }
          .og-metrics-link::after { content: ''; }
        }
      `}</style>

      <header className="og-header" style={{
        background: '#111418', borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: '54px', display: 'flex', alignItems: 'center', gap: '10px',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/og-group-logo.png" alt="OG Group" style={{ height: '30px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
        <span style={{ fontSize: '10px', fontWeight: 500, color: '#BFEF5A', background: 'rgba(191,239,90,0.12)', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Tracker
        </span>

        <div className="og-hide-sm" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />

        <div className="og-hide-sm" style={{ alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Sistema Ativo</span>
        </div>

        <span className="og-show-sm" style={{ alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
        </span>

        <div style={{ flex: 1 }} />

        {delayed > 0 && (
          <div className="og-hide-sm" style={{ alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(201,42,42,0.15)', border: '1px solid rgba(201,42,42,0.3)', flexShrink: 0 }}>
            <AlertTriangle size={12} strokeWidth={1.4} style={{ color: '#f87171' }} />
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#f87171', whiteSpace: 'nowrap' }}>
              {delayed} {delayed === 1 ? 'atrasado' : 'atrasados'}
            </span>
          </div>
        )}

        <Link href="/metrics" className="og-metrics-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <BarChart2 size={13} strokeWidth={1.4} />
        </Link>

        <SyncButton onSynced={load} />
      </header>

      <main className="og-main" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>

        <StatsBar orders={orders} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <SlidersHorizontal size={14} strokeWidth={1.4} style={{ color: '#9299A8', flexShrink: 0 }} />
          {filters.map(f => {
            const active = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
                fontWeight: active ? 500 : 400, border: active ? 'none' : '1px solid #E5E8EE',
                background: active ? '#111418' : '#FFFFFF', color: active ? '#FFFFFF' : '#4A5165',
                cursor: 'pointer', transition: 'all 110ms ease', fontFamily: 'inherit',
              }}>
                {f.label}
              </button>
            )
          })}
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9299A8' }}>
            {loading ? 'Carregando...' : `${orders.length} pedido${orders.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="og-skeleton" style={{ height: '52px', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : (
          <OrdersTable orders={orders} />
        )}

        <p style={{ fontSize: '11px', color: '#9299A8', textAlign: 'center', margin: '4px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Wifi size={11} strokeWidth={1.4} />
          Toque em um pedido para ver detalhes · Sync 08:00 e 20:00 BRT
        </p>
      </main>
    </div>
  )
}
