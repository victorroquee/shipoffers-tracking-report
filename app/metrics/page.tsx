'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart2, ArrowLeft, Wifi } from 'lucide-react'
import MetricsPanel from '@/components/MetricsPanel'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(setMetrics)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <style>{`
        .og-header { padding: 0 24px; }
        .og-main { padding: 20px 24px; }
        .og-hide-sm { display: flex; }
        @media (max-width: 768px) {
          .og-header { padding: 0 14px; }
          .og-main { padding: 12px 14px; }
          .og-hide-sm { display: none !important; }
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
        <div className="og-hide-sm" style={{ alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Sistema Ativo</span>
        </div>
        <div style={{ flex: 1 }} />
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <ArrowLeft size={13} strokeWidth={1.4} />
          <span className="og-hide-sm" style={{ display: 'inline' }}>Pedidos</span>
        </Link>
      </header>

      <main className="og-main" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={16} strokeWidth={1.4} style={{ color: '#4A5165' }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#0C0E13', letterSpacing: '-0.4px' }}>Metricas de Entrega</span>
        </div>
        {metrics ? <MetricsPanel data={metrics} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="og-stats">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="og-skeleton" style={{ height: '96px', animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <div className="og-skeleton" style={{ height: '260px' }} />
          </div>
        )}
        <p style={{ fontSize: '11px', color: '#9299A8', textAlign: 'center', margin: '4px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Wifi size={11} strokeWidth={1.4} />
          Dados agregados · Atualizacao automatica 2x/dia
        </p>
      </main>
    </div>
  )
}
