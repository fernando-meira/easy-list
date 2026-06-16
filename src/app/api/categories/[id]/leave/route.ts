import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { leaveSharedList } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: authSecret });
    const userId = token?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: categoryId } = await context.params;

    const result = await leaveSharedList(userId, categoryId);

    if (result === 'not-found') {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    if (result === 'not-member') {
      return NextResponse.json({ error: 'Você não é membro desta lista' }, { status: 403 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao sair da lista' }, { status: 500 });
  }
}
