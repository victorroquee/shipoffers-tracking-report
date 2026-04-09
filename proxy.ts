// proxy.ts — HTTP Basic Auth (substitui middleware.ts no Next.js 16+)
import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  // Rotas de API não usam Basic Auth (usam CRON_SECRET)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
      const [user, pass] = decoded.split(':')
      if (user === process.env.DASHBOARD_USER && pass === process.env.DASHBOARD_PASS) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Acesso restrito', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="OG Group - Shipoffers Tracker"' },
  })
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
