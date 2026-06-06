import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { getProducts, createProduct } from '@/lib/firestore-domain';

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });

  return token?.sub ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const products = await getProducts(userId);

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const product = await createProduct(userId, data);

    if (!product) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
