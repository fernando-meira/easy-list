import crypto from 'crypto';

import { z } from 'zod';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

import { clientPromise } from '@/lib/mongodb-adapter';
import { getMongoUserFacingError } from '@/lib/mongo-error';
import {
  getAppBaseUrl,
  logEmailError,
  getEmailFromAddress,
  validateEmailConfig,
  getResendUserFacingError
} from '@/lib/email-error';

const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de validação para o request
const sendLoginSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Função para gerar código numérico de 4 dígitos
function generateVerificationCode() {
  // Gera um número aleatório entre 0000 e 9999
  const code = Math.floor(Math.random() * 10000);
  // Garante que sempre terá 4 dígitos (adiciona zeros à esquerda se necessário)
  return code.toString().padStart(4, '0');
}

// Função para gerar token para magic link
function generateMagicLinkToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validação do corpo da requisição
    const result = sendLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const emailConfig = validateEmailConfig({ requireBaseUrl: true });
    console.log('🥲 ~ emailConfig:', emailConfig);

    if (!emailConfig.isValid) {
      console.error('Configuração de email inválida', {
        issues: emailConfig.issues,
        environment: process.env.NODE_ENV,
        hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
        emailFrom: emailConfig.emailFrom,
        baseUrl: emailConfig.baseUrl,
      });

      return NextResponse.json(
        { error: 'Serviço de email configurado incorretamente. Verifique as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    // Gerar código de verificação e token para magic link
    const verificationCode = generateVerificationCode();
    const magicLinkToken = generateMagicLinkToken();

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

    // Salvar o código e o token no banco
    await db.collection('verificationCodes').insertOne({
      email,
      code: verificationCode,
      token: magicLinkToken,
      expiresAt,
      createdAt: new Date(),
      used: false,
      attempts: 0
    });

    // Criar URL do magic link
    const baseUrl = getAppBaseUrl();
    const magicLinkUrl = `${baseUrl}/api/auth/callback/email?token=${magicLinkToken}&email=${encodeURIComponent(email)}`;

    // Enviar email com código e magic link
    try {
      const emailResult = await resend.emails.send({
        from: getEmailFromAddress(),
        to: email,
        subject: 'Acesse sua conta - Easy List',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 24px;">Bem-vindo ao Easy List!</h1>

          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Você solicitou acesso à sua conta. Escolha uma das opções abaixo para continuar:
          </p>

          <!-- Opção 1: Magic Link -->
          <div style="margin-bottom: 32px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #0d9488;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
              🔗 Opção 1: Link Mágico
            </h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
              Clique no botão abaixo para acessar automaticamente:
            </p>
            <a href="${magicLinkUrl}"
               style="display: inline-block; padding: 12px 32px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Acessar Easy List
            </a>
          </div>

          <!-- Opção 2: Código -->
          <div style="margin-bottom: 32px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #0d9488;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
              🔑 Opção 2: Código de Verificação
            </h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
              Ou use este código na tela de login:
            </p>
            <div style="display: inline-block; padding: 16px 32px; background-color: #fff; color: #333; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; border: 2px solid #0d9488;">
              ${verificationCode}
            </div>
          </div>

          <!-- Informações adicionais -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
              ⏱️ Este código e link expiram em <strong>10 minutos</strong>.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 16px;">
              Se você não solicitou este acesso, por favor ignore este email.
            </p>
          </div>
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
      logEmailError('Falha ao enviar login email', emailError, {
        to: email,
        from: getEmailFromAddress(),
        environment: process.env.NODE_ENV,
      });

      // Remover o código do banco já que o email falhou
      await db.collection('verificationCodes').deleteOne({
        email,
        code: verificationCode,
      });

      return NextResponse.json(
        { error: getResendUserFacingError(emailError) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar solicitação de login:', error);

    return NextResponse.json(
      { error: getMongoUserFacingError(error) },
      { status: 500 }
    );
  }
}
