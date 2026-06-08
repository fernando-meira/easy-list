import { getToken } from 'next-auth/jwt';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });
  const userId = token?.sub ?? null;

  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const firebaseToken = await getAuth().createCustomToken(userId);

    return NextResponse.json({ token: firebaseToken }, { status: 200 });
  } catch (error) {
    console.error('Failed to create Firebase custom token:', error);

    return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 });
  }
}
