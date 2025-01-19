import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request });

    if (!token?.email?.includes('@admin')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    // Busca todas as categorias sem userId
    const categories = await Category.find({ userId: { $exists: false } });

    console.log(`Encontradas ${categories.length} categorias para migrar`);

    // Atualiza cada categoria com o userId do token
    for (const category of categories) {
      await Category.findByIdAndUpdate(category._id, {
        $set: { userId: token.sub }
      });
    }

    return NextResponse.json({
      message: 'Migração concluída com sucesso',
      categoriesMigrated: categories.length
    });
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return NextResponse.json(
      { error: 'Erro ao migrar categorias' },
      { status: 500 }
    );
  }
}
