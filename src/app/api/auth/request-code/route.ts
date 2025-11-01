import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import crypto from 'crypto';

import { clientPromise } from '@/lib/mongodb-adapter';

const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de validação para o request
const requestCodeSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Função para gerar código alfanumérico de 4 caracteres
function generateVerificationCode() {
  // Gera caracteres alfanuméricos (letras maiúsculas e números)
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validação do corpo da requisição
    const result = requestCodeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Verificar se a API key do Resend está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY não está configurada');
      return NextResponse.json(
        { error: 'Serviço de email não configurado' },
        { status: 500 }
      );
    }

    // Gerar código de verificação
    const verificationCode = generateVerificationCode();

    // Definir data de expiração (10 minutos a partir de agora)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Conectar ao MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Verificar se já existem muitas tentativas recentes para este email
    const recentAttempts = await db.collection('verificationCodes').countDocuments({
      email,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Últimas 1 hora
    });

    if (recentAttempts >= 5) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Por favor, tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    // Salvar o código no banco
    await db.collection('verificationCodes').insertOne({
      email,
      code: verificationCode,
      expiresAt,
      createdAt: new Date(),
      used: false,
      attempts: 0
    });

    // Enviar email com o código
    try {
      const emailResult = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Easy List <onboarding@resend.dev>',
        to: email,
        subject: 'Código de acesso - Easy List',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bem-vindo ao Easy List!</h1>
        <p>Use o código abaixo para acessar sua conta:</p>
        <div style="display: inline-block; padding: 12px 24px; background-color: #f5f5f5; color: #333; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 16px 0; border-radius: 5px; border: 1px solid #ddd;">
        ${verificationCode}
        </div>
        <p>Este código expira em 10 minutos.</p>
        <p style="color: #666; font-size: 14px;">Se você não solicitou este código, por favor ignore este email.</p>
      </div>
      `,
      });

      // Verificar se o email foi enviado com sucesso
      if (emailResult.error) {
        console.error('Erro do Resend ao enviar email:', emailResult.error);
        throw new Error(`Falha ao enviar email: ${emailResult.error.message}`);
      }

      console.log('Email enviado com sucesso:', emailResult.data);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);

      // Remover o código do banco já que o email falhou
      await db.collection('verificationCodes').deleteOne({
        email,
        code: verificationCode,
      });

      return NextResponse.json(
        { error: 'Erro ao enviar email. Por favor, tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar solicitação de código:', error);

    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
