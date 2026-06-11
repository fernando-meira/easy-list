import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  getCategoryWithProducts,
  getCategoriesWithProducts,
} from '@/lib/firestore-domain';

interface CategoryData {
  name: string;
}

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

    const url = new URL(request.url);
    const categoryId = url.searchParams.get('id');

    if (categoryId) {
      const category = await getCategoryWithProducts(userId, categoryId);

      if (!category) {
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
      }

      return NextResponse.json(category, { status: 200 });
    }

    const categories = await getCategoriesWithProducts(userId);

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data: CategoryData = await request.json();

    if (!data.name) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const category = await createCategory(userId, data.name);

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    const wasDeleted = await deleteCategory(userId, id);

    if (!wasDeleted) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    const data: CategoryData = await request.json();

    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const category = await updateCategory(userId, id, data.name.trim());

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: category }, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}
