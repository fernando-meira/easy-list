import { NextResponse } from 'next/server';
import { z } from 'zod';

import { clientPromise } from '@/lib/mongodb-adapter';

// Schema de validação para o request
const verifyCodeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(4, 'Código deve ter 4 caracteres'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validação do corpo da requisição
    const result = verifyCodeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { email, code } = result.data;

    // Conectar ao MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Buscar o código de verificação
    const verificationCode = await db.collection('verificationCodes').findOne({
      email,
      code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationCode) {
    // Verificar se o código existe mas já foi usado ou expirou
      const invalidCode = await db.collection('verificationCodes').findOne({
        email,
        code,
      });

      if (invalidCode) {
        // Incrementar tentativas
        await db.collection('verificationCodes').updateOne(
          { _id: invalidCode._id },
          { $inc: { attempts: 1 } }
        );

        if (invalidCode.used) {
          return NextResponse.json(
            { error: 'Código já utilizado' },
            { status: 400 }
          );
        }

        if (invalidCode.expiresAt < new Date()) {
          return NextResponse.json(
            { error: 'Código expirado' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }

    // Verificar se o número de tentativas excedeu o limite
    if (verificationCode.attempts >= 5) {
      return NextResponse.json(
        { error: 'Número máximo de tentativas excedido' },
        { status: 400 }
      );
    }

    // Marcar o código como usado
    await db.collection('verificationCodes').updateOne(
      { _id: verificationCode._id },
      { $set: { used: true } }
    );

    // Buscar ou criar o usuário
    const user = await db.collection('users').findOne({ email });

    if (!user) {
    // Criar um novo usuário se não existir
      await db.collection('users').insertOne({
        email,
        emailVerified: new Date(),
        createdAt: new Date(),
      });
    }

    // Retornar sucesso para que o frontend possa fazer o login
    return NextResponse.json({ success: true, email });

  } catch (error) {
    console.error('Erro ao verificar código:', error);

    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
