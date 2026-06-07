import { z } from 'zod';
import { NextResponse } from 'next/server';

import { upsertAuthUserByEmail } from '@/lib/firestore-auth-users';
import {
  isVerificationRecordUsable,
  findVerificationRecordByCode,
  incrementVerificationAttempts,
} from '@/lib/firestore-verification-codes';

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

    // Buscar o código de verificação
    const verificationCode = await findVerificationRecordByCode(email, code);

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }

    if (!isVerificationRecordUsable(verificationCode)) {
      await incrementVerificationAttempts(verificationCode.id);

      if (verificationCode.used) {
        return NextResponse.json(
          { error: 'Código já utilizado' },
          { status: 400 }
        );
      }

      if (verificationCode.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Código expirado' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Número máximo de tentativas excedido' },
        { status: 400 }
      );
    }

    await upsertAuthUserByEmail(email);

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
