'use client'
import { useEffect, useState } from 'react'
import { Globe, Clock } from 'lucide-react'
import { FLAG_CDN_URL } from '@/lib/constants'

interface Metrics {
  total: number
  active: number
  delivered: number
  delayed: number
  inTransit: number
  pending: number
  avgTransitTime: number | null
  avgByCountry: { country: string; avgDays: number; total: number; delayed: number }[]
}

// --- Donut chart (2 slices: no prazo vs atrasado) ---
function DeliveryDonut({ onTime, delayed, size }: { onTime: number; delayed: number; size: number }) {
  const total = onTime + delayed
  if (total === 0) return null

  const cx = size / 2
  const cy = size / 2
  const r = (size - 16) / 2
  const circumference = 2 * Math.PI * r
  const onTimePct = onTime / total
  const delayedOffset = circumference * onTimePct

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F2F5" strokeWidth={14} />
        {/* Green arc: no prazo */}
        {onTime > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22c55e" strokeWidth={14}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - onTimePct)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 600ms ease' }} />
        )}
        {/* Red arc: atrasado */}
        {delayed > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#C92A2A" strokeWidth={14}
            strokeDasharray={`${circumference * (delayed / total)} ${circumference * onTimePct}`}
            strokeDashoffset={-delayedOffset}
            strokeLinecap="round"
            style={{ transition: 'all 600ms ease' }} />
        )}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: '#0C0E13', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {total}
        </span>
        <span style={{ fontSize: '10px', color: '#9299A8', marginTop: '2px' }}>ativos</span>
      </div>
    </div>
  )
}

export default function DashboardPanel() {
  const [m, setM] = useState<Metrics | null>(null)

  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => { if (data && typeof data.total === 'number') setM(data) })
      .catch(() => {})
  }, [])

  if (!m) return null

  const active = m.active ?? (m.total - m.delivered)
  // For the donut: "no prazo" = active orders NOT delayed, "atrasado" = delayed
  const onTimeActive = active - m.delayed - m.pending
  const maxCountryDays = Math.max(...m.avgByCountry.map(c => c.avgDays), 7)

  return (
    <div className="og-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <style>{`
        @media (max-width: 768px) {
          .og-dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Left: Donut — No Prazo vs Atrasado */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E8EE', borderRadius: '12px',
        padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <Globe size={14} strokeWidth={1.4} style={{ color: '#9299A8' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4A5165', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Prazo de Entrega (7 dias)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <DeliveryDonut onTime={Math.max(0, onTimeActive)} delayed={m.delayed} size={130} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '3px', background: '#22c55e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#9299A8' }}>No Prazo</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#0D6330', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.max(0, onTimeActive)}
                  <span style={{ fontSize: '12px', fontWeight: 400, color: '#9299A8', marginLeft: '6px' }}>
                    {active > 0 ? `${Math.round((Math.max(0, onTimeActive) / active) * 100)}%` : ''}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '3px', background: '#C92A2A', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#9299A8' }}>Atrasado (&gt;7 dias)</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#C92A2A', fontVariantNumeric: 'tabular-nums' }}>
                  {m.delayed}
                  <span style={{ fontSize: '12px', fontWeight: 400, color: '#9299A8', marginLeft: '6px' }}>
                    {active > 0 ? `${Math.round((m.delayed / active) * 100)}%` : ''}
                  </span>
                </div>
              </div>
            </div>
            {m.pending > 0 && (
              <div style={{ fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '3px', background: '#B45309', flexShrink: 0 }} />
                {m.pending} aguardando envio
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Country delivery bars with 7-day reference line */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E8EE', borderRadius: '12px',
        padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <Clock size={14} strokeWidth={1.4} style={{ color: '#9299A8' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4A5165', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tempo Medio por Pais
          </span>
          {m.avgTransitTime != null && (
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9299A8' }}>
              Media: <strong style={{ color: '#0C0E13' }}>{m.avgTransitTime}d</strong>
            </span>
          )}
        </div>

        {m.avgByCountry.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {m.avgByCountry.map(c => {
              const barPct = (c.avgDays / maxCountryDays) * 100
              const refLinePct = (7 / maxCountryDays) * 100
              const isOnTime = c.avgDays <= 7
              const barColor = isOnTime ? '#22c55e' : c.avgDays <= 14 ? '#f59e0b' : '#C92A2A'

              return (
                <div key={c.country}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${FLAG_CDN_URL}/${c.country.toLowerCase()}.png`}
                      alt={c.country} width={18} height={13}
                      style={{ borderRadius: '2px', flexShrink: 0, objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#4A5165', width: '28px' }}>{c.country}</span>
                    <span style={{ fontSize: '10px', color: '#9299A8' }}>{c.total} ped.</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: barColor, fontVariantNumeric: 'tabular-nums' }}>
                      {c.avgDays}d
                    </span>
                    {c.delayed > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#C92A2A' }}>
                        {c.delayed} atraso
                      </span>
                    )}
                  </div>
                  {/* Bar with 7-day reference line */}
                  <div style={{ position: 'relative', width: '100%', height: '8px', borderRadius: '4px', background: '#F0F2F5', overflow: 'visible' }}>
                    <div style={{
                      width: `${Math.min(barPct, 100)}%`, height: '100%', borderRadius: '4px',
                      background: barColor, transition: 'width 400ms ease',
                    }} />
                    {/* 7-day reference line */}
                    <div style={{
                      position: 'absolute', left: `${Math.min(refLinePct, 100)}%`, top: '-3px',
                      width: '2px', height: '14px', background: '#0C0E13', borderRadius: '1px',
                      opacity: 0.3,
                    }} />
                  </div>
                </div>
              )
            })}
            {/* Legend for reference line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{ width: '2px', height: '10px', background: '#0C0E13', borderRadius: '1px', opacity: 0.3 }} />
              <span style={{ fontSize: '10px', color: '#9299A8' }}>Meta: 7 dias</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#9299A8', fontSize: '12px' }}>
            Nenhuma entrega registrada
          </div>
        )}
      </div>
    </div>
  )
}
