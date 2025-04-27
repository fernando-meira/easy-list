'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useUser } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/header';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function VerifyRequestPage() {
  useAuth(false);
  const router = useRouter();
  const { initialEmail } = useUser();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Header isSimple />

      <div className="w-full max-w-md p-4 space-y-4 text-center">
        <h1 className="text-3xl font-bold">Verifique seu email</h1>

        <p className="text-muted-foreground">
          Um link de confirmação foi enviado para o email <b className="font-bold text-primary">{initialEmail}</b>. Verifique a <b className="font-bold text-primary">caixa de entrada</b> ou <b className="font-bold text-primary">spam</b> e clique no link para acessar sua conta.
        </p>

        <div className="text-sm text-muted-foreground">
          {status === 'loading' ? (
            <div className="flex items-center flex-col gap-2">
              Verificando autenticação

              <LoadingSpinner />
            </div>
          ) : (
            <div className="flex items-center flex-col gap-2">
              Aguardando confirmação.

              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
