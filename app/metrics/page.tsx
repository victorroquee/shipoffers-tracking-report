'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart2, ArrowLeft, Wifi } from 'lucide-react'
import MetricsPanel from '@/components/MetricsPanel'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(setMetrics)
  }, [])

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

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

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

        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', color: 'rgba(255,255,255,0.5)',
          textDecoration: 'none', padding: '5px 10px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <ArrowLeft size={13} strokeWidth={1.4} />
          Pedidos
        </Link>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <BarChart2 size={16} strokeWidth={1.4} style={{ color: '#4A5165' }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#0C0E13', letterSpacing: '-0.4px' }}>
            Metricas de Entrega
          </span>
        </div>

        {metrics ? (
          <MetricsPanel data={metrics} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="og-skeleton" style={{ height: '96px', animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <div className="og-skeleton" style={{ height: '260px' }} />
          </div>
        )}

        <p style={{ fontSize: '11px', color: '#9299A8', textAlign: 'center', margin: '4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Wifi size={11} strokeWidth={1.4} />
          Dados agregados de todos os pedidos rastreados · Atualizacao automatica 2x/dia
        </p>
      </main>
    </div>
  )
}
