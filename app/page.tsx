'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, SlidersHorizontal, BarChart2, Wifi } from 'lucide-react'
import OrdersTable from '@/components/OrdersTable'
import StatsBar from '@/components/StatsBar'
import SyncButton from '@/components/SyncButton'

type FilterType = 'all' | 'delayed' | 'delivered'

const filters: { key: FilterType; label: string }[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'delayed',   label: 'Em Atraso' },
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
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const delayed = orders.filter(o => o.isDelayed && o.status !== 'DELIVERED').length

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        background: '#111418',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        height: '54px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: '#1C2128', border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <Image src="/og-logo.svg" alt="OG Group" width={28} height={28} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>
            OG Group
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 500, color: '#BFEF5A',
            background: 'rgba(191,239,90,0.12)', padding: '2px 7px',
            borderRadius: '20px', letterSpacing: '0.02em',
          }}>
            Tracker
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        {/* Sistema Ativo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            display: 'inline-block', width: '7px', height: '7px',
            borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 6px rgba(34,197,94,0.7)',
          }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            Sistema Ativo
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Atraso badge */}
        {delayed > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(201,42,42,0.15)',
            border: '1px solid rgba(201,42,42,0.3)',
          }}>
            <AlertTriangle size={12} strokeWidth={1.4} style={{ color: '#f87171' }} />
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#f87171' }}>
              {delayed} {delayed === 1 ? 'pedido atrasado' : 'pedidos atrasados'}
            </span>
          </div>
        )}

        {/* Metricas link */}
        <Link href="/metrics" style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', color: 'rgba(255,255,255,0.5)',
          textDecoration: 'none', padding: '5px 10px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'all 110ms ease',
        }}>
          <BarChart2 size={13} strokeWidth={1.4} />
          Metricas
        </Link>

        <SyncButton onSynced={load} />
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>

        <StatsBar orders={orders} />

        {/* Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={14} strokeWidth={1.4} style={{ color: '#9299A8' }} />
          {filters.map(f => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '5px 14px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: active ? 500 : 400,
                  border: active ? 'none' : '1px solid #E5E8EE',
                  background: active ? '#111418' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#4A5165',
                  cursor: 'pointer', transition: 'all 110ms ease',
                  fontFamily: 'inherit',
                }}
              >
                {f.label}
              </button>
            )
          })}
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9299A8' }}>
            {loading ? 'Carregando...' : `${orders.length} pedido${orders.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Tabela */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="og-skeleton" style={{ height: '52px', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : (
          <OrdersTable orders={orders} />
        )}

        <p style={{ fontSize: '11px', color: '#9299A8', textAlign: 'center', margin: '4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Wifi size={11} strokeWidth={1.4} />
          Atualizacao automatica 08:00 e 20:00 BRT · Clique em um pedido para ver detalhes
        </p>
      </main>
    </div>
  )
}
