'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle, SlidersHorizontal, BarChart2, Wifi, Search, ChevronDown, Download } from 'lucide-react'
import OrdersTable from '@/components/OrdersTable'
import StatsBar from '@/components/StatsBar'
import DashboardPanel from '@/components/DashboardPanel'

type FilterType = 'active' | 'delayed' | 'ontime' | 'pending' | 'delivered'
const filters: { key: FilterType; label: string }[] = [
  { key: 'active', label: 'Ativos' },
  { key: 'delayed', label: 'Atrasados' },
  { key: 'ontime', label: 'No Prazo' },
  { key: 'pending', label: 'Aguardando Envio' },
  { key: 'delivered', label: 'Entregues (arquivo)' },
]

export default function HomePage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState<FilterType>('active')
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [country, setCountry] = useState('')
  const [countries, setCountries] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetch('/api/orders?countries=true')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data.countries)) setCountries(data.countries) })
      .catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [debouncedSearch, country, filter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (country) params.set('country', country)
      params.set('filter', filter)
      params.set('page', String(page))
      params.set('per_page', '25')

      const res = await fetch(`/api/orders?${params.toString()}`)
      const data = await res.json()

      setOrders(Array.isArray(data.orders) ? data.orders : [])
      setTotal(typeof data.total === 'number' ? data.total : 0)
      setTotalPages(typeof data.total_pages === 'number' ? data.total_pages : 1)
    } catch {
      setOrders([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, country, filter, page])

  useEffect(() => { load() }, [load])

  const delayed = orders.filter(o => o.isDelayed && o.status !== 'DELIVERED').length
  const startItem = total === 0 ? 0 : (page - 1) * 25 + 1
  const endItem = Math.min(page * 25, total)

  const exportCSV = useCallback(async () => {
    let exportOrders = orders
    if (filter === 'delayed') {
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (country) params.set('country', country)
        params.set('filter', 'delayed')
        params.set('per_page', '9999')
        const res = await fetch(`/api/orders?${params.toString()}`)
        const data = await res.json()
        if (Array.isArray(data.orders)) exportOrders = data.orders
      } catch { /* fall back to current page */ }
    }

    const formatDate = (iso: string | null | undefined) => {
      if (!iso) return ''
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }
    const escape = (val: string | number | null | undefined) => {
      const s = String(val ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }

    const headers = 'ID Pedido,Nome Cliente,Codigo Rastreio,Pais,Dias desde Pedido,Status,Data Pedido,Data Envio'
    const rows = exportOrders.map(o => [
      escape(o.orderId ?? o.id),
      escape(o.customerName),
      escape(o.trackingCode),
      escape(o.destinationCountry),
      escape(o.daysSinceOrder ?? o.daysInTransit),
      escape(o.status),
      escape(formatDate(o.orderedAt)),
      escape(formatDate(o.shippedAt)),
    ].join(','))

    const csv = '\uFEFF' + headers + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-${filter}-${dateStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [orders, filter, debouncedSearch, country])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <style>{`
        .og-header { padding: 0 24px; }
        .og-main { padding: 20px 24px; }
        .og-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .og-hide-sm { display: flex; }
        .og-show-sm { display: none; }
        @media (max-width: 768px) {
          .og-header { padding: 0 14px; }
          .og-main { padding: 12px 14px; }
          .og-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .og-hide-sm { display: none !important; }
          .og-show-sm { display: flex !important; }
        }
      `}</style>

      <header className="og-header" style={{
        background: '#111418', borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: '54px', display: 'flex', alignItems: 'center', gap: '10px',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
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

        <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <BarChart2 size={13} strokeWidth={1.4} />
        </Link>
      </header>

      <main className="og-main" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>

        <StatsBar orders={orders} />

        <DashboardPanel />

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#E5E8EE' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9299A8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Pedidos Individuais
          </span>
          <div style={{ flex: 1, height: '1px', background: '#E5E8EE' }} />
        </div>

        {/* Search + Country filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={13} strokeWidth={1.4} style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: '#9299A8', pointerEvents: 'none',
            }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por rastreio ou cliente..."
              style={{
                width: '280px', padding: '7px 12px 7px 32px',
                background: '#FFFFFF', border: '1px solid #E5E8EE',
                borderRadius: '8px', fontSize: '12px', color: '#0C0E13',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{
                padding: '7px 32px 7px 12px',
                background: '#FFFFFF', border: '1px solid #E5E8EE',
                borderRadius: '8px', fontSize: '12px', color: '#0C0E13',
                fontFamily: 'inherit', appearance: 'none', cursor: 'pointer',
                outline: 'none', minWidth: '140px',
              }}>
              <option value="">Todos os paises</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} strokeWidth={1.4} style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              color: '#9299A8', pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Status filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <SlidersHorizontal size={14} strokeWidth={1.4} style={{ color: '#9299A8', flexShrink: 0 }} />
          {filters.map(f => {
            const isActive = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
                fontWeight: isActive ? 500 : 400, border: isActive ? 'none' : '1px solid #E5E8EE',
                background: isActive ? '#111418' : '#FFFFFF', color: isActive ? '#FFFFFF' : '#4A5165',
                cursor: 'pointer', transition: 'all 110ms ease', fontFamily: 'inherit',
              }}>
                {f.label}
              </button>
            )
          })}
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9299A8' }}>
            {loading ? 'Carregando...' : `${total} pedido${total !== 1 ? 's' : ''}`}
          </span>
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
            fontWeight: 500, border: '1px solid rgba(59,188,120,0.35)',
            background: 'rgba(59,188,120,0.08)', color: '#3bbc78',
            cursor: 'pointer', transition: 'all 110ms ease', fontFamily: 'inherit', flexShrink: 0,
          }}>
            <Download size={13} strokeWidth={1.4} />
            Exportar CSV
          </button>
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

        {!loading && totalPages > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '8px', padding: '4px 0',
          }}>
            <span style={{ fontSize: '11px', color: '#9299A8' }}>
              {total === 0 ? 'Nenhum resultado' : `Mostrando ${startItem}–${endItem} de ${total} pedidos`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#4A5165' }}>
                Pagina {page} de {totalPages || 1}
              </span>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{
                  padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 400,
                  border: '1px solid #E5E8EE',
                  background: page <= 1 ? '#F0F2F5' : '#FFFFFF',
                  color: page <= 1 ? '#C0C5D0' : '#4A5165',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 110ms ease', fontFamily: 'inherit',
                }}>Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{
                  padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 400,
                  border: '1px solid #E5E8EE',
                  background: page >= totalPages ? '#F0F2F5' : '#FFFFFF',
                  color: page >= totalPages ? '#C0C5D0' : '#4A5165',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 110ms ease', fontFamily: 'inherit',
                }}>Proximo</button>
            </div>
          </div>
        )}

        <p style={{ fontSize: '11px', color: '#9299A8', textAlign: 'center', margin: '4px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Wifi size={11} strokeWidth={1.4} />
          Toque em um pedido para ver detalhes
        </p>
      </main>
    </div>
  )
}
