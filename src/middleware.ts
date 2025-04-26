import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { PagesEnum } from '@/types/enums';

const publicRoutes = [PagesEnum.login, PagesEnum.verifyRequest];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!token && !isPublicRoute) {
    const url = new URL(PagesEnum.login, request.url);

    return NextResponse.redirect(url);
  }

  if (token && isPublicRoute) {
    const url = new URL(PagesEnum.home, request.url);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
