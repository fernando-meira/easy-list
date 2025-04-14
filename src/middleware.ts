import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/verify-request'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  console.log('Middleware executado:', {
    path: request.nextUrl.pathname,
    hasToken: !!token,
    isPublicRoute,
  });

  if (!token && !isPublicRoute) {
    console.log('Redirecionando para /login: usuário não autenticado em rota protegida');
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  if (token && isPublicRoute) {
    console.log('Redirecionando para /: usuário autenticado em rota pública');
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  console.log('Permitindo acesso à rota:', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
