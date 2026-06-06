import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { getProduct, deleteProduct, updateProduct } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });

  return token?.sub ?? null;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const data = await request.json();
    const product = await updateProduct(userId, id, data);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const product = await getProduct(userId, id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Error getting product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const wasDeleted = await deleteProduct(userId, id);

    if (!wasDeleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
  }
}
