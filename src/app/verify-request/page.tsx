'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useAuth } from '@/hooks/useAuth';

export default function VerifyRequestPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Página de verificação não requer autenticação
  useAuth(false);

  // Redireciona para a página inicial quando o usuário for autenticado
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold">Verifique seu email</h1>
        <p className="text-muted-foreground">
          Enviamos um link de acesso para seu email. Por favor, verifique sua caixa
          de entrada e clique no link para acessar sua conta.
        </p>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {status === 'loading' ? (
              'Verificando autenticação...'
            ) : (
              'Aguardando confirmação do email...'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
