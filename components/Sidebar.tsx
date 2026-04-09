'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, BarChart2, RefreshCw } from 'lucide-react'

const navItems = [
  { href: '/',        label: 'Pedidos',  icon: Package },
  { href: '/metrics', label: 'Metricas', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '216px',
      minHeight: '100vh',
      background: '#111418',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      alignSelf: 'flex-start',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
      }}>
        <div style={{
          width: '30px', height: '30px',
          borderRadius: '7px',
          background: '#1C2128',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <Image src="/og-logo.svg" alt="OG Group" width={30} height={30} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>
          OG Group
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '10px',
          fontWeight: 500,
          color: '#BFEF5A',
          background: 'rgba(191,239,90,0.12)',
          padding: '2px 7px',
          borderRadius: '20px',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
          Tracker
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 10px 0', flex: 1 }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 500,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0 8px',
            display: 'block',
            marginBottom: '3px',
          }}>
            Monitoramento
          </span>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 9px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: active ? 500 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                marginBottom: '1px',
                transition: 'all 110ms ease',
              }}>
                <Icon size={15} strokeWidth={1.4} style={{ opacity: active ? 1 : 0.7 }} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px',
            borderRadius: '50%',
            background: 'rgba(191,239,90,0.15)',
            border: '1px solid rgba(191,239,90,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 600,
            color: '#BFEF5A',
            flexShrink: 0,
          }}>
            OG
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>OG Group</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)' }}>Admin</div>
          </div>
          <RefreshCw size={13} strokeWidth={1.4} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
    </aside>
  )
}
