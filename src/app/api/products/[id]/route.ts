import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const data = await request.json();

    // Atualiza o produto com os novos dados, incluindo a categoria
    const product = await Product.findByIdAndUpdate(
      id,
      {
        ...data,
        category: data.categoryId, // Usar categoryId como referência para a categoria
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('category'); // Popular a categoria completa

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Error updating product' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const product = await Product.findById(id).populate('category');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Error getting product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const product = await Product.findByIdAndDelete(id).populate('category', 'name');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Error deleting product' },
      { status: 500 }
    );
  }
}
