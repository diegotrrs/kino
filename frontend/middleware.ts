import { detectLocale } from '@/lib/locale';
import { type NextRequest, NextResponse } from 'next/server';

export const middleware = (request: NextRequest): NextResponse => {
  const response = NextResponse.next();

  // Only set locale cookie on first visit — never overwrite an explicit user choice
  if (!request.cookies.get('locale')) {
    const acceptLanguage = request.headers.get('accept-language') ?? '';
    const locale = detectLocale(acceptLanguage);
    response.cookies.set('locale', locale, {
      path: '/',
      sameSite: 'lax',
      // Not httpOnly — client JS may need to read it for SSR hydration
    });
  }

  return response;
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
