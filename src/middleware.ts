import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://neardear.in',
  'https://www.neardear.in',
  // Add preview/staging domains here when needed
]

const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001']

function getAllowedOrigins(): string[] {
  return process.env.NODE_ENV === 'production'
    ? ALLOWED_ORIGINS
    : [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-cron-secret',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') ?? ''
  const allowed = getAllowedOrigins()

  // Only apply CORS logic to API routes
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Preflight
  if (req.method === 'OPTIONS') {
    if (allowed.includes(origin)) {
      return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
    }
    return new NextResponse(null, { status: 403 })
  }

  // Actual request — attach headers if origin is allowed, block if not
  if (origin && !allowed.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const response = NextResponse.next()
  if (origin && allowed.includes(origin)) {
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => response.headers.set(k, v))
  }
  return response
}

export const config = {
  matcher: '/api/:path*',
}
