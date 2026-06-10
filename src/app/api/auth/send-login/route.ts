import crypto from 'crypto';

import { z } from 'zod';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

import {
  getAppBaseUrl,
  logEmailError,
  getEmailFromAddress,
  validateEmailConfig,
  getResendUserFacingError
} from '@/lib/email-error';
import {
  createVerificationRecord,
  deleteVerificationRecord,
  countRecentVerificationAttempts,
} from '@/lib/firestore-verification-codes';

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

    // Verificar se já existem muitas tentativas recentes para este email
    const recentAttempts = await countRecentVerificationAttempts(
      email,
      new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentAttempts >= 5) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Por favor, tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    // Salvar o código e o token no banco
    const verificationRecordId = await createVerificationRecord({
      email,
      code: verificationCode,
      token: magicLinkToken,
      expiresAt,
    });

    // Criar URL do magic link
    const baseUrl = getAppBaseUrl();
    const magicLinkUrl = `${baseUrl}/api/auth/callback/email?token=${magicLinkToken}&email=${encodeURIComponent(email)}`;

    // Enviar email com código e magic link
    try {
      const emailResult = await resend.emails.send({
        from: getEmailFromAddress(),
        to: email,
        subject: 'Acesse sua conta — Easy List',
        html: `
        <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <div style="padding: 48px 48px 32px;">
            <p style="font-size: 28px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.2; color: #111111; margin: 0;">
              Easy List
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 0 48px 48px;">
            <p style="font-size: 16px; font-weight: 400; line-height: 1.5; color: #374151; margin: 0 0 32px;">
              Você solicitou acesso à sua conta. Use o botão ou o código abaixo para entrar.
            </p>

            <!-- Magic Link -->
            <div style="margin-bottom: 32px;">
              <p style="font-size: 14px; font-weight: 500; color: #6b7280; margin: 0 0 12px; line-height: 1.4;">
                Clique no botão para acessar diretamente:
              </p>
              <a href="${magicLinkUrl}"
                 style="display: inline-block; padding: 12px 20px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; line-height: 1;">
                Acessar Easy List
              </a>
            </div>

            <!-- Divider -->
            <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>

            <!-- Código de verificação -->
            <div style="background-color: #f5f5f5; border-radius: 12px; padding: 32px; margin-bottom: 32px; text-align: center;">
              <p style="font-size: 14px; font-weight: 400; color: #6b7280; line-height: 1.5; margin: 0 0 16px;">
                Ou use este código na tela de login:
              </p>
              <div style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 36px; font-weight: 600; letter-spacing: 12px; color: #111111; line-height: 1;">
                ${verificationCode}
              </div>
            </div>

            <!-- Informações adicionais -->
            <p style="font-size: 14px; font-weight: 400; color: #6b7280; line-height: 1.5; margin: 0 0 8px;">
              O código e o link expiram em <strong style="color: #374151; font-weight: 600;">10 minutos</strong>.
            </p>
            <p style="font-size: 13px; font-weight: 500; color: #898989; line-height: 1.4; margin: 0;">
              Se você não solicitou este acesso, ignore este email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #101010; padding: 32px 48px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 14px; font-weight: 400; color: #a1a1aa; line-height: 1.5; margin: 0;">
              Easy List — Suas listas, organizadas.
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
    } catch (emailError) {
      logEmailError('Falha ao enviar login email', emailError, {
        to: email,
        from: getEmailFromAddress(),
        environment: process.env.NODE_ENV,
      });

      // Remover o código do banco já que o email falhou
      await deleteVerificationRecord(verificationRecordId);

      return NextResponse.json(
        { error: getResendUserFacingError(emailError) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar solicitação de login:', error);

    return NextResponse.json(
      { error: 'Erro ao processar solicitação de login' },
      { status: 500 }
    );
  }
}
