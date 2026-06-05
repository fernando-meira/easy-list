'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Mail, ArrowLeft } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VerifyRequestPage() {
  useAuth(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(600);

  useEffect(() => {
    const stored = sessionStorage.getItem('auth_email');
    if (stored) setEmail(stored);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    if (!email) return;
    try {
      setIsResending(true);
      const response = await fetch('/api/auth/send-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { error?: string }).error || 'Erro ao reenviar email.');
      }
      setResendCountdown(600);
    } catch (error) {
      console.error(error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Header isSimple />

      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-card shadow-sm p-8 space-y-6 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Verifique seu email</h1>
            {email && (
              <p className="mt-1 text-sm text-muted-foreground">
                Enviamos um link para{' '}
                <strong className="font-semibold text-foreground">{email}</strong>
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Verifique a caixa de entrada ou spam.
            </p>
          </div>

          <div className="space-y-2">
            {resendCountdown > 0 ? (
              <Button variant="outline" disabled className="w-full">
                Reenviar em {formatCountdown(resendCountdown)}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? <LoadingSpinner /> : 'Reenviar email'}
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => router.push('/login')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para o login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
