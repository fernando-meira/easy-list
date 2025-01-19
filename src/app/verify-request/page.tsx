'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/header';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function VerifyRequestPage() {
  useAuth(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Header isSimple />

      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg text-center">
        <h1 className="text-3xl font-bold">Verifique seu email</h1>

        <p className="text-muted-foreground">
          Um link de confirmação foi enviado para o seu email. Verifique a <strong>caixa de entrada</strong> ou <strong>spam</strong> e clique no link para acessar sua conta.
        </p>

        <div className="text-sm text-muted-foreground">
          {status === 'loading' ? (
            <div className="flex items-center flex-col gap-2">
              Verificando autenticação

              <LoadingSpinner />
            </div>
          ) : (
            <div className="flex items-center flex-col gap-2">
              Aguardando confirmação

              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
