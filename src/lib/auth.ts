import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { AuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Resend } from 'resend';

import { clientPromise } from './mongodb-adapter';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        try {
          if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY não está configurada');
            throw new Error('Serviço de email não configurado');
          }

          const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Easy List <onboarding@resend.dev>',
            to: identifier,
            subject: 'Link de acesso - Easy List',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Bem-vindo ao Easy List!</h1>
                <p>Clique no link abaixo para acessar sua conta:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">
                  Acessar Easy List
                </a>
                <p style="color: #666; font-size: 14px;">Se você não solicitou este link, por favor ignore este email.</p>
              </div>
            `,
          });

          if (result.error) {
            console.error('Erro do Resend ao enviar email:', result.error);
            throw new Error(`Falha ao enviar email: ${result.error.message}`);
          }

          console.log('Email enviado com sucesso:', result.data);
        } catch (error) {
          console.error('Erro ao enviar email:', error);
          throw new Error('Erro ao enviar email de verificação');
        }
      },
    }),
    // Provider para autenticação por código
    CredentialsProvider({
      id: 'verification-code',
      name: 'Verification Code',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Código', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          return null;
        }

        try {
          // Conectar ao MongoDB
          const client = await clientPromise;
          const db = client.db();

          // Verificar se o código é válido
          const verificationCode = await db.collection('verificationCodes').findOne({
            email: credentials.email,
            code: credentials.code,
            used: true, // Já deve ter sido marcado como usado pela API
            expiresAt: { $gt: new Date() }
          });

          if (!verificationCode) {
            return null;
          }

          // Buscar o usuário
          const user = await db.collection('users').findOne({
            email: credentials.email
          });

          if (!user) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || null,
          };
        } catch (error) {
          console.error('Erro ao autenticar com código:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
};
