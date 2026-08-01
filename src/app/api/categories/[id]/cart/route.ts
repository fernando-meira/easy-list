import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { toggleBatchCart } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: authSecret });
    const userId = token?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: categoryId } = await context.params;
    const body = await request.json() as { addToCart?: boolean; productIds?: string[] };
    const { addToCart, productIds } = body;

    if (typeof addToCart !== 'boolean') {
      return NextResponse.json({ error: 'Parâmetro addToCart é obrigatório' }, { status: 400 });
    }

    const success = await toggleBatchCart(userId, categoryId, addToCart, productIds);

    if (!success) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar produtos no carrinho' }, { status: 500 });
  }
}
