import nodemailer from 'nodemailer'

const isMock = process.env.USE_MOCK === 'true'

const transporter = !isMock ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
}) : null

export interface DelayedOrder {
  shipofffersId: string
  trackingCode: string | null
  customerName: string | null
  destinationCountry: string | null
  shippedAt: Date | null
  daysInTransit: number | null
  delayThreshold: number | null
  status: string
}

export async function sendDelayAlert(orders: DelayedOrder[]): Promise<void> {
  if (!orders.length) return

  const rows = orders.map(o => `
    <tr>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.shipofffersId}</td>
      <td style="padding:8px;border:1px solid #2a2a2a;font-family:monospace">${o.trackingCode ?? '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.customerName ?? '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.destinationCountry ?? '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.shippedAt ? new Date(o.shippedAt).toLocaleDateString('pt-BR') : '—'}</td>
      <td style="padding:8px;border:1px solid #2a2a2a;color:#ff4444;font-weight:bold">
        ${o.daysInTransit ?? '?'} dias (limite: ${o.delayThreshold ?? '?'})
      </td>
      <td style="padding:8px;border:1px solid #2a2a2a">${o.status}</td>
    </tr>`).join('')

  const html = `
    <div style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:32px;max-width:900px;margin:0 auto;border-radius:8px">
      <h2 style="color:#ff4444;margin-top:0">⚠️ Pedidos em Atraso — OG Group</h2>
      <p style="color:#aaa">Os pedidos abaixo ultrapassaram o threshold de dias em trânsito sem confirmação de entrega.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#1a1a1a;color:#888;text-transform:uppercase;font-size:11px">
            <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">ID</th>
            <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Rastreio</th>
            <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Cliente</th>
            <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">País</th>
            <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Enviado em</th>
            <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Dias / Limite</th>
            <th style="padding:10px;border:1px solid #2a2a2a;text-align:left">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#555;font-size:11px;margin-top:24px">Enviado automaticamente pelo Shipoffers Tracker — OG Group</p>
    </div>
  `

  if (isMock) {
    console.log(`[MOCK] Email de alerta seria enviado para ${orders.length} pedido(s) em atraso:`)
    orders.forEach(o => console.log(`  → ${o.shipofffersId} | ${o.trackingCode} | ${o.destinationCountry} | ${o.daysInTransit}d/${o.delayThreshold}d`))
    return
  }

  await transporter!.sendMail({
    from: process.env.ALERT_FROM,
    to: process.env.ALERT_TO_SHIPOFFERS,
    subject: `⚠️ ${orders.length} pedido(s) em atraso — OG Group`,
    html,
  })
}
