import { NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({});

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const data = await request.json();

    const product = await Product.create(data);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
