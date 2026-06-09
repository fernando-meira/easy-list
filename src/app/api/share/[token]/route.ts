import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { joinSharedList } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const jwtToken = await getToken({ req: request, secret: authSecret });
    const userId = jwtToken?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { token } = await context.params;

    const result = await joinSharedList(token, userId);

    if (!result) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao entrar na lista' }, { status: 500 });
  }
}
