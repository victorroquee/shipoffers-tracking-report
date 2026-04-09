'use client'
import React, { useState } from 'react'
import StatusBadge from './StatusBadge'
import { ChevronDown, ChevronUp, ExternalLink, Mail, MailCheck, Clock, MapPin, Calendar, Package } from 'lucide-react'

interface OrderEvent {
  id: string
  occurredAt: string
  description: string | null
}

interface Order {
  id: string
  shipofffersId: string
  trackingCode: string | null
  customerName: string | null
  customerEmail: string | null
  destinationCountry: string | null
  shippedAt: string | null
  deliveredAt: string | null
  daysInTransit: number | null
  delayThreshold: number | null
  status: string
  isDelayed: boolean
  alertSentAt: string | null
  lastTrackingSync: string | null
  events?: OrderEvent[]
}

const th: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '10px',
  fontWeight: 600,
  color: '#9299A8',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  textAlign: 'left',
  borderBottom: '1px solid #E5E8EE',
  background: '#F8F9FB',
  whiteSpace: 'nowrap',
}

function DetailRow({ order }: { order: Order }) {
  const items = [
    {
      icon: Package,
      label: 'ID Shipoffers',
      value: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>{order.shipofffersId}</span>,
    },
    {
      icon: ExternalLink,
      label: 'Codigo de Rastreio',
      value: order.trackingCode ? (
        <a
          href={`https://t.17track.net/en#nums=${order.trackingCode}`}
          target="_blank" rel="noopener noreferrer"
          style={{ color: '#1D4ED8', fontFamily: 'ui-monospace, monospace', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          {order.trackingCode}
          <ExternalLink size={10} strokeWidth={1.4} />
        </a>
      ) : <span style={{ color: '#9299A8' }}>Sem codigo</span>,
    },
    {
      icon: Mail,
      label: 'Email do Cliente',
      value: order.customerEmail
        ? <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>{order.customerEmail}</span>
        : <span style={{ color: '#9299A8' }}>—</span>,
    },
    {
      icon: MapPin,
      label: 'Pais de Destino',
      value: order.destinationCountry
        ? <span style={{ fontFamily: 'ui-monospace, monospace', background: '#F0F2F5', padding: '1px 8px', borderRadius: '4px', fontWeight: 500, color: '#4A5165', fontSize: '11px' }}>{order.destinationCountry}</span>
        : <span style={{ color: '#9299A8' }}>—</span>,
    },
    {
      icon: Calendar,
      label: 'Data de Envio',
      value: order.shippedAt
        ? new Date(order.shippedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : <span style={{ color: '#9299A8' }}>—</span>,
    },
    {
      icon: Calendar,
      label: 'Data de Entrega',
      value: order.deliveredAt
        ? <span style={{ color: '#0D6330', fontWeight: 500 }}>{new Date(order.deliveredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        : <span style={{ color: '#9299A8' }}>Nao entregue</span>,
    },
    {
      icon: Clock,
      label: 'Ultima Sincronizacao',
      value: order.lastTrackingSync
        ? new Date(order.lastTrackingSync).toLocaleString('pt-BR')
        : <span style={{ color: '#9299A8' }}>Nunca</span>,
    },
    {
      icon: Clock,
      label: 'Limite de Atraso',
      value: order.delayThreshold
        ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{order.delayThreshold} dias</span>
        : <span style={{ color: '#9299A8' }}>—</span>,
    },
  ]

  return (
    <tr style={{ background: order.isDelayed ? '#FFF5F5' : '#FAFBFC' }}>
      <td colSpan={7} style={{ padding: '16px 20px 16px 40px', borderBottom: '1px solid #E5E8EE' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px 24px', marginBottom: order.events?.length ? '14px' : 0 }}>
          {items.map(item => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <item.icon size={11} strokeWidth={1.4} style={{ color: '#9299A8', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#9299A8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.label}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#0C0E13' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Alert email */}
        {order.isDelayed && (
          <div style={{
            marginTop: '12px',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '8px',
            background: order.alertSentAt ? '#EDFAF3' : '#FFFBEB',
            border: `1px solid ${order.alertSentAt ? '#bbf7d0' : '#fde68a'}`,
          }}>
            {order.alertSentAt
              ? <MailCheck size={13} strokeWidth={1.4} style={{ color: '#0D6330' }} />
              : <Mail size={13} strokeWidth={1.4} style={{ color: '#B45309' }} />
            }
            <span style={{ fontSize: '11px', fontWeight: 500, color: order.alertSentAt ? '#0D5C2E' : '#B45309' }}>
              {order.alertSentAt
                ? `Email enviado em ${new Date(order.alertSentAt).toLocaleString('pt-BR')}`
                : 'Email de alerta ainda nao enviado'
              }
            </span>
          </div>
        )}

        {/* Historico de eventos */}
        {order.events && order.events.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#9299A8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
              Historico de Eventos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {order.events.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span style={{ color: '#9299A8', flexShrink: 0 }}>
                    {new Date(e.occurredAt).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ width: '1px', height: '12px', background: '#E5E8EE', flexShrink: 0 }} />
                  <span style={{ color: '#4A5165' }}>{e.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!orders.length)
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '8px', padding: '64px 24px',
        background: '#FFFFFF', border: '1px solid #E5E8EE', borderRadius: '12px',
        color: '#9299A8', textAlign: 'center', fontSize: '13px',
      }}>
        <p style={{ margin: 0, fontWeight: 500, color: '#4A5165' }}>Nenhum pedido encontrado</p>
        <p style={{ margin: 0, fontSize: '12px' }}>Tente sincronizar ou alterar o filtro</p>
      </div>
    )

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E5E8EE', background: '#FFFFFF' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: '32px', padding: '8px 8px 8px 14px' }}></th>
            <th style={th}>Pedido</th>
            <th style={th}>Cliente</th>
            <th style={th}>Pais</th>
            <th style={th}>Dias / Limite</th>
            <th style={th}>Status</th>
            <th style={th}>Alerta</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const open = expanded === order.id
            const rowBg = order.isDelayed ? '#FFF8F8' : '#FFFFFF'
            const rowBgHover = order.isDelayed ? '#FFF0F0' : '#F8F9FB'

            return (
              <React.Fragment key={order.id}>
                <tr
                  onClick={() => setExpanded(open ? null : order.id)}
                  style={{
                    borderBottom: open ? 'none' : '1px solid #E5E8EE',
                    background: open ? (order.isDelayed ? '#FFF5F5' : '#FAFBFC') : rowBg,
                    cursor: 'pointer',
                    transition: 'background 110ms ease',
                  }}
                  onMouseEnter={e => { if (!open) e.currentTarget.style.background = rowBgHover }}
                  onMouseLeave={e => { if (!open) e.currentTarget.style.background = rowBg }}
                >
                  {/* Chevron */}
                  <td style={{ padding: '10px 4px 10px 14px', color: '#9299A8' }}>
                    {open
                      ? <ChevronUp size={14} strokeWidth={1.4} />
                      : <ChevronDown size={14} strokeWidth={1.4} />
                    }
                  </td>

                  {/* Pedido */}
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500, color: '#0C0E13', marginBottom: '2px' }}>
                      {order.customerName ?? <span style={{ color: '#9299A8', fontWeight: 400 }}>Sem nome</span>}
                    </div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#9299A8' }}>
                      {order.shipofffersId}
                    </div>
                  </td>

                  {/* Cliente */}
                  <td style={{ padding: '10px 14px' }}>
                    {order.trackingCode ? (
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#1D4ED8' }}>
                        {order.trackingCode}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#9299A8' }}>Sem rastreio</span>
                    )}
                    {order.customerEmail && (
                      <div style={{ fontSize: '10px', color: '#9299A8', marginTop: '2px' }}>
                        {order.customerEmail}
                      </div>
                    )}
                  </td>

                  {/* Pais */}
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontFamily: 'ui-monospace, monospace', fontSize: '11px',
                      background: '#F0F2F5', padding: '2px 8px', borderRadius: '4px',
                      color: '#4A5165', fontWeight: 500,
                    }}>
                      {order.destinationCountry ?? '?'}
                    </span>
                    {order.shippedAt && (
                      <div style={{ fontSize: '10px', color: '#9299A8', marginTop: '3px' }}>
                        Enviado {new Date(order.shippedAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </td>

                  {/* Dias / Limite */}
                  <td style={{ padding: '10px 14px' }}>
                    {order.daysInTransit != null ? (
                      <span style={{
                        fontWeight: 600,
                        color: order.isDelayed ? '#C92A2A' : '#0C0E13',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: '13px',
                      }}>
                        {order.daysInTransit}d
                        {order.delayThreshold && (
                          <span style={{ fontWeight: 400, fontSize: '11px', color: '#9299A8' }}>
                            {' '}/ {order.delayThreshold}d
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: '#9299A8' }}>—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={order.status} />
                  </td>

                  {/* Alerta */}
                  <td style={{ padding: '10px 14px' }}>
                    {order.isDelayed ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                          background: '#FFF0F0', color: '#C92A2A',
                        }}>
                          Em Atraso
                        </span>
                        {order.alertSentAt ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                            background: '#EDFAF3', color: '#0D5C2E',
                          }}>
                            <MailCheck size={9} strokeWidth={1.4} />
                            Email Enviado
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 500,
                            background: '#FFFBEB', color: '#B45309',
                          }}>
                            <Mail size={9} strokeWidth={1.4} />
                            Aguardando
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#9299A8', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                </tr>

                {open && <DetailRow order={order} />}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
