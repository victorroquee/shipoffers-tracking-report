'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, ArrowLeft, Check, AlertCircle } from 'lucide-react'

type Threshold = {
  id: string
  countryCode: string
  countryName: string
  days: number
  updatedAt: string
}

type RowState = {
  current: number
  original: number
  saving: boolean
  saved: boolean
  error: string | null
}

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState<Threshold[]>([])
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/thresholds')
      .then(res => res.json())
      .then((data: Threshold[]) => {
        if (Array.isArray(data)) {
          setThresholds(data)
          const states: Record<string, RowState> = {}
          for (const t of data) {
            states[t.countryCode] = { current: t.days, original: t.days, saving: false, saved: false, error: null }
          }
          setRowStates(states)
        } else {
          setFetchError('Erro ao carregar thresholds.')
        }
      })
      .catch(() => setFetchError('Erro ao carregar thresholds.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (countryCode: string, value: string) => {
    const num = parseInt(value, 10)
    setRowStates(prev => ({
      ...prev,
      [countryCode]: { ...prev[countryCode], current: isNaN(num) ? prev[countryCode].current : num, saved: false, error: null },
    }))
  }

  const handleSave = async (countryCode: string) => {
    const row = rowStates[countryCode]
    if (!row) return
    setRowStates(prev => ({ ...prev, [countryCode]: { ...prev[countryCode], saving: true, error: null } }))
    try {
      const res = await fetch('/api/settings/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, days: row.current }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `Erro ${res.status}`)
      }
      setRowStates(prev => ({
        ...prev,
        [countryCode]: { ...prev[countryCode], saving: false, saved: true, original: row.current, error: null },
      }))
      // Fade out "Salvo!" after 2s
      setTimeout(() => {
        setRowStates(prev => ({
          ...prev,
          [countryCode]: { ...prev[countryCode], saved: false },
        }))
      }, 2000)
    } catch (e) {
      setRowStates(prev => ({
        ...prev,
        [countryCode]: { ...prev[countryCode], saving: false, error: e instanceof Error ? e.message : 'Erro ao salvar' },
      }))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <header style={{
        background: '#111418', borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: '54px', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
          fontSize: '12px', padding: '5px 10px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)', transition: 'color 110ms ease',
        }}>
          <ArrowLeft size={13} strokeWidth={1.4} />
          Voltar
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginLeft: '4px' }}>
          <Settings size={14} strokeWidth={1.4} style={{ color: '#BFEF5A' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>
            Configuracoes
          </span>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '820px', width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111418', margin: '0 0 4px' }}>
            Thresholds de Atraso por Pais
          </h1>
          <p style={{ fontSize: '13px', color: '#9299A8', margin: 0 }}>
            Defina quantos dias um pedido pode ficar em transito antes de gerar um alerta de atraso.
          </p>
        </div>

        {fetchError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(201,42,42,0.08)', border: '1px solid rgba(201,42,42,0.2)',
            color: '#c92a2a', fontSize: '13px', marginBottom: '16px',
          }}>
            <AlertCircle size={15} strokeWidth={1.4} />
            {fetchError}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                height: '52px', borderRadius: '10px',
                background: 'linear-gradient(90deg, #e5e8ee 25%, #eef0f4 50%, #e5e8ee 75%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 1.4s ease ${i * 80}ms infinite`,
              }} />
            ))}
          </div>
        ) : (
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            border: '1px solid #E5E8EE', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E8EE', background: '#F8F9FB' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#4A5165', width: '40%' }}>
                    Pais
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#4A5165', width: '15%' }}>
                    Codigo
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#4A5165', width: '20%' }}>
                    Dias para Alerta
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#4A5165', width: '25%' }}>
                    Acao
                  </th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t, idx) => {
                  const row = rowStates[t.countryCode]
                  if (!row) return null
                  const changed = row.current !== row.original
                  return (
                    <tr
                      key={t.countryCode}
                      style={{
                        borderBottom: idx < thresholds.length - 1 ? '1px solid #F0F2F5' : 'none',
                        background: 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 16px', color: '#111418', fontWeight: 400 }}>
                        {t.countryName}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 500,
                          color: '#9299A8', background: '#F0F2F5',
                          padding: '2px 8px', borderRadius: '6px',
                          fontFamily: 'monospace',
                        }}>
                          {t.countryCode}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={row.current}
                          onChange={e => handleChange(t.countryCode, e.target.value)}
                          style={{
                            width: '80px', padding: '6px 10px',
                            background: '#F8F9FB', border: changed ? '1px solid #BFEF5A' : '1px solid #E5E8EE',
                            borderRadius: '8px', fontSize: '13px', color: '#111418',
                            fontFamily: 'inherit', outline: 'none', textAlign: 'center',
                            transition: 'border-color 110ms ease',
                          }}
                        />
                        <span style={{ marginLeft: '6px', fontSize: '12px', color: '#9299A8' }}>dias</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {changed && (
                            <button
                              onClick={() => handleSave(t.countryCode)}
                              disabled={row.saving}
                              style={{
                                padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
                                fontWeight: 500, border: 'none',
                                background: row.saving ? '#E5E8EE' : '#111418',
                                color: row.saving ? '#9299A8' : '#FFFFFF',
                                cursor: row.saving ? 'not-allowed' : 'pointer',
                                transition: 'all 110ms ease', fontFamily: 'inherit',
                              }}
                            >
                              {row.saving ? 'Salvando...' : 'Salvar'}
                            </button>
                          )}
                          {row.saved && (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              fontSize: '12px', color: '#3bbc78', fontWeight: 500,
                            }}>
                              <Check size={13} strokeWidth={2} />
                              Salvo!
                            </span>
                          )}
                          {row.error && (
                            <span style={{ fontSize: '12px', color: '#c92a2a' }}>
                              {row.error}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
