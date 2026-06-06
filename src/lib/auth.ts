import { Resend } from 'resend';
import { AuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

import { authSecret } from './auth-secret';
import { clientPromise } from './mongodb-adapter';
import {
  getAppBaseUrl,
  logEmailError,
  getEmailFromAddress,
  validateEmailConfig,
  getResendUserFacingError
} from './email-error';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: authSecret,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      // Google is treated as trusted for verified emails in this app.
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        try {
          const emailConfig = validateEmailConfig({ requireBaseUrl: true });

          if (!emailConfig.isValid) {
            console.error('Configuração de email inválida no NextAuth', {
              issues: emailConfig.issues,
              environment: process.env.NODE_ENV,
              hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
              emailFrom: emailConfig.emailFrom,
              baseUrl: emailConfig.baseUrl,
            });

            throw new Error('Serviço de email configurado incorretamente. Verifique o ambiente.');
          }

          const result = await resend.emails.send({
            from: getEmailFromAddress(),
            to: identifier,
            subject: 'Link de acesso - Easy List',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Bem-vindo ao Easy List!</h1>
                <p>Clique no link abaixo para acessar sua conta:</p>
                <a href="${new URL(url, getAppBaseUrl()).toString()}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">
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
          logEmailError('Falha ao enviar email de verificação NextAuth', error, {
            to: identifier,
            from: getEmailFromAddress(),
            environment: process.env.NODE_ENV,
          });

          throw new Error(getResendUserFacingError(error));
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

          const verificationCode = await db.collection('verificationCodes').findOne({
            email: credentials.email,
            code: credentials.code,
            used: false,
            expiresAt: { $gt: new Date() }
          });

          if (!verificationCode) {
            return null;
          }

          if (verificationCode.attempts >= 5) {
            return null;
          }

          let user = await db.collection('users').findOne({
            email: credentials.email
          });

          if (!user) {
            const result = await db.collection('users').insertOne({
              email: credentials.email,
              emailVerified: new Date(),
              createdAt: new Date(),
            });

            user = {
              _id: result.insertedId,
              email: credentials.email,
              name: null,
            };
          } else if (!user.emailVerified) {
            await db.collection('users').updateOne(
              { _id: user._id },
              { $set: { emailVerified: new Date() } }
            );
          }

          await db.collection('verificationCodes').updateOne(
            { _id: verificationCode._id },
            { $set: { used: true, usedAt: new Date() } }
          );

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
