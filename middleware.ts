import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from './next-i18next.config'

export function middleware(request: NextRequest) {
  const locale = request.nextUrl.locale || i18n.defaultLocale
  request.nextUrl.searchParams.set('lang', locale)
  return NextResponse.rewrite(request.nextUrl)
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
} 