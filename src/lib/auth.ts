import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { AuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { Resend } from 'resend';

import { clientPromise } from './mongodb-adapter';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        try {
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

          console.log('Email enviado:', result);
        } catch (error) {
          console.error('Erro ao enviar email:', error);
          throw new Error('Erro ao enviar email de verificação');
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
};
