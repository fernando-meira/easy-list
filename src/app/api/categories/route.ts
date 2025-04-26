import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';

interface CategoryData {
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const categoryId = url.searchParams.get('id');

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        userId: token.sub
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Categoria não encontrada' },
          { status: 404 }
        );
      }

      const products = await Product.find({ category: category._id });

      const categoryWithProducts = {
        ...category.toObject(),
        products,
      };

      return NextResponse.json(categoryWithProducts, { status: 200 });
    }

    const categories = await Category.find({ userId: token.sub }).sort({ createdAt: -1 });

    let categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ category: category._id });

        return {
          ...category.toObject(),
          products,
        };
      })
    );

    if (categoriesWithProducts.length === 0) {
      const defaultCategory = await Category.create({
        name: 'Supermercado',
        userId: token.sub,
      });

      categoriesWithProducts = [{
        ...defaultCategory.toObject(),
        products: []
      }];
    }

    return NextResponse.json(categoriesWithProducts, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data: CategoryData = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name: data.name,
      userId: token.sub,
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se a categoria pertence ao usuário
    const category = await Category.findOne({ _id: id, userId: token.sub });

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Primeiro, deleta todos os produtos associados à categoria
    await Product.deleteMany({ category: id });

    // Depois, deleta a categoria
    await Category.findByIdAndDelete(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 });
  }
}
