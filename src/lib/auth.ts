import { Resend } from 'resend';
import { AuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { FirestoreAdapter } from '@auth/firebase-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cert } from 'firebase-admin/app';

import { authSecret } from './auth-secret';
import { upsertAuthUserByEmail } from './firestore-auth-users';
import {
  findVerificationRecordByCode,
  incrementVerificationAttempts,
  isVerificationRecordUsable,
  markVerificationRecordUsed,
} from './firestore-verification-codes';
import {
  getAppBaseUrl,
  logEmailError,
  getEmailFromAddress,
  validateEmailConfig,
  getResendUserFacingError
} from './email-error';

const resend = new Resend(process.env.RESEND_API_KEY);

const firebaseAdapterCredential = cert({
  projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
  clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
});

export const authOptions: AuthOptions = {
  adapter: FirestoreAdapter({
    credential: firebaseAdapterCredential,
  }),
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
          const verificationCode = await findVerificationRecordByCode(
            credentials.email,
            credentials.code
          );

          if (!verificationCode) {
            return null;
          }

          if (!isVerificationRecordUsable(verificationCode)) {
            await incrementVerificationAttempts(verificationCode.id);
            return null;
          }

          const user = await upsertAuthUserByEmail(credentials.email);
          await markVerificationRecordUsed(verificationCode.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Erro ao autenticar com código:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile) {
        token.picture = (profile as { picture?: string }).picture ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
};
