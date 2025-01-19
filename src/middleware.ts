import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Force Node.js runtime
export const runtime = 'nodejs'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Add runtime header to help with debugging
  const response = NextResponse.next()
  response.headers.set('x-runtime', process.env.NEXT_RUNTIME || 'unknown')
  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api/auth).*)',
    // Optional: add auth paths if needed
    '/api/auth/:path*',
  ],
} 