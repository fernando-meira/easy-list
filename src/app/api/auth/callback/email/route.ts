import { encode } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { upsertAuthUserByEmail } from '@/lib/firestore-auth-users';
import {
  isVerificationRecordUsable,
  markVerificationRecordUsed,
  findVerificationRecordByToken,
} from '@/lib/firestore-verification-codes';

const sessionMaxAge = 30 * 24 * 60 * 60;

function getSessionCookieName() {
  return process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
    }

    const decodedEmail = decodeURIComponent(email);
    const verificationRecord = await findVerificationRecordByToken(decodedEmail, token);

    if (!verificationRecord || !isVerificationRecordUsable(verificationRecord)) {
      return NextResponse.redirect(new URL('/login?error=ExpiredToken', request.url));
    }

    const user = await upsertAuthUserByEmail(decodedEmail);
    await markVerificationRecordUsed(verificationRecord.id);

    if (!authSecret) {
      throw new Error('Auth secret is not configured');
    }

    const sessionToken = await encode({
      secret: authSecret,
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.image,
      },
      maxAge: sessionMaxAge,
    });

    const response = NextResponse.redirect(new URL('/', request.url));

    response.cookies.set(getSessionCookieName(), sessionToken, {
      maxAge: sessionMaxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no callback do magic link:', error);

    return NextResponse.redirect(new URL('/login?error=CallbackError', request.url));
  }
}
