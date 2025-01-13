import { NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({}).sort({ createdAt: -1 });

    // Fetch products for each category
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
        name: 'Supermercado'
      });
      categoriesWithProducts = [{
        ...defaultCategory.toObject(),
        products: []
      }];
    }

    return NextResponse.json(categoriesWithProducts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const data = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name: data.name,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
