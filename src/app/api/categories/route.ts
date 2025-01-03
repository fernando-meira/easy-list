import { NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
  try {
    await connectDB();

    let categories = await Category.find({}).sort({ createdAt: -1 });

    if (categories.length === 0) {
      const defaultCategory = await Category.create({
        name: 'Supermercado'
      });
      categories = [defaultCategory];
    }

    return NextResponse.json(categories);
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
