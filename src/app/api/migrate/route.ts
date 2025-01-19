import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    // Busca todas as categorias sem userId
    const categories = await Category.find({ userId: { $exists: false } });

    if (categories.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma categoria precisa ser migrada.'
      });
    }

    // Atualiza cada categoria com o userId do usuário atual
    for (const category of categories) {
      await Category.findByIdAndUpdate(category._id, {
        $set: { userId: token.sub }
      });
    }

    return NextResponse.json({
      message: `Migração concluída. ${categories.length} categorias foram migradas.`
    });
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return NextResponse.json(
      { error: 'Erro ao migrar categorias' },
      { status: 500 }
    );
  }
}
