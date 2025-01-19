import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(req: Request) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db();
    
    // Remove o token de verificação
    await db.collection('verification_tokens').deleteMany({
      identifier: token.email,
    });

    // Remove a sessão do usuário
    await db.collection('sessions').deleteMany({
      userId: token.sub,
    });

    await client.close();

    return NextResponse.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao realizar logout:', error);
    return NextResponse.json(
      { message: 'Erro ao realizar logout' },
      { status: 500 }
    );
  }
}
