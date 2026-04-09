const config: Record<string, { label: string; bg: string; color: string }> = {
  DELIVERED:        { label: 'Entregue',        bg: '#EDFAF3', color: '#0D5C2E' },
  IN_TRANSIT:       { label: 'Em Transito',     bg: '#EFF6FF', color: '#1D4ED8' },
  OUT_FOR_DELIVERY: { label: 'Saiu p/ Entrega', bg: '#FFFBEB', color: '#B45309' },
  EXCEPTION:        { label: 'Excecao',         bg: '#FFF0F0', color: '#C92A2A' },
  PENDING:          { label: 'Pendente',        bg: '#F0F2F5', color: '#4A5165' },
  UNKNOWN:          { label: 'Desconhecido',    bg: '#F0F2F5', color: '#9299A8' },
}

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? config.UNKNOWN
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: 600,
      lineHeight: 1.6,
      background: c.bg,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}
