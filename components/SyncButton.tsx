'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function SyncButton({ onSynced }: { onSynced: () => void }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [cooldown, setCooldown] = useState(false)

  async function handle() {
    if (cooldown) return
    setLoading(true)
    setMsg('')

    const headers: Record<string, string> = {
      'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET ?? '',
    }

    try {
      const syncRes = await fetch('/api/sync', { method: 'POST', headers })
      if (!syncRes.ok) throw new Error('Sync failed')
      const trackRes = await fetch('/api/track', { method: 'POST', headers })
      if (!trackRes.ok) throw new Error('Track failed')
      setMsg('Sincronizado')
      onSynced()
      setCooldown(true)
      setTimeout(() => setCooldown(false), 30000)
    } catch {
      setMsg('Erro ao sincronizar')
    } finally {
      setLoading(false)
    }
  }

  const isError = msg.startsWith('Erro')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {msg && (
        <span style={{
          fontSize: '11px',
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: '20px',
          background: isError ? '#FFF0F0' : '#EDFAF3',
          color: isError ? '#C92A2A' : '#0D5C2E',
        }}>
          {msg}
        </span>
      )}
      <button
        onClick={handle}
        disabled={loading || cooldown}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: loading || cooldown ? '#E5E8EE' : '#111418',
          color: loading || cooldown ? '#9299A8' : '#fff',
          padding: '7px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 500,
          border: 'none',
          cursor: loading || cooldown ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.1px',
          transition: 'background 120ms ease',
          fontFamily: 'inherit',
        }}
      >
        <RefreshCw
          size={13}
          strokeWidth={1.4}
          style={{
            animation: loading ? 'spin 1s linear infinite' : 'none',
          }}
        />
        {loading ? 'Sincronizando...' : cooldown ? 'Aguarde...' : 'Sync Manual'}
      </button>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
