import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { isLocale, localeCookieName, normalizeLocale, resolveLocaleFromAcceptLanguage } from './features/i18n/settings'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [maybeLocale, ...restSegments] = pathname.split('/').filter(Boolean)
  const cookieLocale = request.cookies.get(localeCookieName)?.value
  const requestLocale = isLocale(maybeLocale)
    ? maybeLocale
    : cookieLocale
      ? normalizeLocale(cookieLocale)
      : resolveLocaleFromAcceptLanguage(request.headers.get('accept-language'))

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-locale', requestLocale)

  if (isLocale(maybeLocale)) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = restSegments.length > 0 ? `/${restSegments.join('/')}` : '/'

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })
    response.cookies.set(localeCookieName, requestLocale, {
      maxAge: 31536000,
      path: '/',
      sameSite: 'lax',
    })

    return response
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|locales).*)'],
}
