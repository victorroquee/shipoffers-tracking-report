export default function DelayFlag({ isDelayed, alertSentAt }: { isDelayed: boolean; alertSentAt: string | null }) {
  if (!isDelayed) return <span style={{ color: '#9299A8', fontSize: '12px' }}>—</span>
  return (
    <span
      title={alertSentAt
        ? `Email enviado em ${new Date(alertSentAt).toLocaleString('pt-BR')}`
        : 'Email pendente de envio'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '10px',
        fontWeight: 600,
        background: '#FFF0F0',
        color: '#C92A2A',
        whiteSpace: 'nowrap',
      }}
    >
      Atraso
      {alertSentAt && (
        <span style={{ fontWeight: 400, color: '#B45309' }}>· email ok</span>
      )}
    </span>
  )
}
