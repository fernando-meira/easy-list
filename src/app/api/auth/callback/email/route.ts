import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { clientPromise } from '@/lib/mongodb-adapter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
    }

    // Conectar ao MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Buscar o token no banco
    const verificationRecord = await db.collection('verificationCodes').findOne({
      email: decodeURIComponent(email),
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationRecord) {
      return NextResponse.redirect(new URL('/login?error=ExpiredToken', request.url));
    }

    // Marcar como usado
    await db.collection('verificationCodes').updateOne(
      { _id: verificationRecord._id },
      { $set: { used: true, usedAt: new Date() } }
    );

    // Buscar ou criar usuário
    let user = await db.collection('users').findOne({ email: verificationRecord.email });

    if (!user) {
      const result = await db.collection('users').insertOne({
        email: verificationRecord.email,
        emailVerified: new Date(),
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, email: verificationRecord.email };
    } else {
      // Atualizar emailVerified se ainda não estiver definido
      if (!user.emailVerified) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { emailVerified: new Date() } }
        );
      }
    }

    // Criar sessão
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30); // 30 dias

    await db.collection('sessions').insertOne({
      sessionToken,
      userId: user._id,
      expires: sessionExpiry,
    });

    // Criar cookie de sessão
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('next-auth.session-token', sessionToken, {
      expires: sessionExpiry,
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
