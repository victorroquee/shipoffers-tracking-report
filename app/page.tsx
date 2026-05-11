'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle, SlidersHorizontal, BarChart2, Wifi, Search, ChevronDown } from 'lucide-react'
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

  // Search state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Country filter state
  const [country, setCountry] = useState('')
  const [countries, setCountries] = useState<string[]>([])

  // Pagination state
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Debounce search: update debouncedSearch 300ms after search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch countries on mount
  useEffect(() => {
    fetch('/api/orders?countries=true')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.countries)) setCountries(data.countries)
      })
      .catch(() => {})
  }, [])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, country, filter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (country) params.set('country', country)
      if (filter !== 'all') params.set('filter', filter)
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

  // Pagination display
  const startItem = total === 0 ? 0 : (page - 1) * 25 + 1
  const endItem = Math.min(page * 25, total)

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

        {/* Search + Country filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={13} strokeWidth={1.4} style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: '#9299A8', pointerEvents: 'none',
            }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por rastreio ou cliente..."
              style={{
                width: '280px', padding: '7px 12px 7px 32px',
                background: '#FFFFFF', border: '1px solid #E5E8EE',
                borderRadius: '8px', fontSize: '12px', color: '#0C0E13',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {/* Country dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              style={{
                padding: '7px 32px 7px 12px',
                background: '#FFFFFF', border: '1px solid #E5E8EE',
                borderRadius: '8px', fontSize: '12px', color: '#0C0E13',
                fontFamily: 'inherit', appearance: 'none', cursor: 'pointer',
                outline: 'none', minWidth: '140px',
              }}
            >
              <option value="">Todos os paises</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
            {loading ? 'Carregando...' : `${total} pedido${total !== 1 ? 's' : ''}`}
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

        {/* Pagination controls */}
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
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 400, border: '1px solid #E5E8EE',
                  background: page <= 1 ? '#F0F2F5' : '#FFFFFF',
                  color: page <= 1 ? '#C0C5D0' : '#4A5165',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 110ms ease', fontFamily: 'inherit',
                }}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 400, border: '1px solid #E5E8EE',
                  background: page >= totalPages ? '#F0F2F5' : '#FFFFFF',
                  color: page >= totalPages ? '#C0C5D0' : '#4A5165',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 110ms ease', fontFamily: 'inherit',
                }}
              >
                Proximo
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: '11px', color: '#9299A8', textAlign: 'center', margin: '4px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Wifi size={11} strokeWidth={1.4} />
          Toque em um pedido para ver detalhes · Sync 08:00 e 20:00 BRT
        </p>
      </main>
    </div>
  )
}
