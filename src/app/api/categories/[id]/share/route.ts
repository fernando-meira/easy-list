import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { generateShareToken } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: authSecret });
    const userId = token?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: categoryId } = await context.params;

    const shareToken = await generateShareToken(userId, categoryId);

    if (!shareToken) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    const origin = request.nextUrl.origin;
    const shareUrl = `${origin}/share/${shareToken}`;

    return NextResponse.json({ shareUrl }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 });
  }
}
