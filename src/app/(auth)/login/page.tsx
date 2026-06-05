'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/otp-input';
import { LoadingSpinner } from '@/components/loading-spinner';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

type EmailFormData = z.infer<typeof emailSchema>;

const codeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(4, 'O código deve ter 4 dígitos'),
});

type CodeFormData = z.infer<typeof codeSchema>;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function ExpiredLinkBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('error') !== 'Verification') return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      Seu link expirou ou já foi usado. Solicite um novo acesso.
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(600);

  useAuth(false);

  useEffect(() => {
    if (!showCodeForm) return;
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
  }, [showCodeForm]);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const {
    control: controlCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
    setValue: setCodeValue,
    reset: resetCodeForm,
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: { email: '', code: '' },
  });

  const sendLoginEmail = async (data: EmailFormData) => {
    setCurrentEmail(data.email);
    setCodeValue('email', data.email);

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/send-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar email. Tente novamente.');
      }

      sessionStorage.setItem('auth_email', data.email);
      setResendCountdown(600);
      setShowCodeForm(true);
      toast.success('Email enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao enviar email. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/send-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao reenviar email. Tente novamente.');
      }
      setResendCountdown(600);
      toast.success('Email reenviado! Verifique sua caixa de entrada.');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('Erro ao reenviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (data: CodeFormData) => {
    try {
      setIsLoading(true);

      const verifyResponse = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, code: data.code }),
      });

      if (!verifyResponse.ok) {
        const errBody = await verifyResponse.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error || 'Código inválido');
      }

      const signInResult = await signIn('verification-code', {
        email: data.email,
        code: data.code,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      router.push('/');
    } catch (error) {
      let errorMessage = 'Erro ao verificar código. Tente novamente.';
      if (error instanceof Error) {
        if (error.message.includes('Código expirado')) {
          errorMessage = 'Código expirado. Solicite um novo código.';
        } else if (error.message.includes('Código já utilizado')) {
          errorMessage = 'Código já utilizado. Solicite um novo código.';
        } else if (error.message.includes('Código inválido')) {
          errorMessage = 'Código inválido. Verifique e tente novamente.';
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmailForm = () => {
    setShowCodeForm(false);
    setCurrentEmail('');
    setResendCountdown(600);
    resetCodeForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Header isSimple />

      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <ExpiredLinkBanner />
        </Suspense>

        <div className="rounded-lg border border-border bg-card shadow-sm p-8 space-y-6">
          {/* Progress indicator */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Passo {showCodeForm ? 2 : 1} de 2
            </p>
            <div className="h-1 bg-muted rounded-full">
              <div
                className={`h-1 bg-primary rounded-full transition-all duration-300 ${
                  showCodeForm ? 'w-full' : 'w-1/2'
                }`}
              />
            </div>
          </div>

          {!showCodeForm ? (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Acesse sua conta</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Digite seu email para continuar
                </p>
              </div>

              <form onSubmit={handleSubmitEmail(sendLoginEmail)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    autoFocus
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    {...registerEmail('email')}
                  />
                  {errorsEmail.email && (
                    <p role="alert" aria-live="polite" className="text-sm text-destructive">
                      {errorsEmail.email.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>Enviando <LoadingSpinner /></>
                  ) : (
                    <>Continuar <ArrowRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Você receberá um link e um código de 4 dígitos
                </p>
              </form>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Verifique seu email</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enviamos o código para{' '}
                  <strong className="font-semibold text-foreground">{currentEmail}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmitCode(verifyCode)} className="space-y-4">
                <div className="space-y-3">
                  <Label className="block text-center">Código de verificação</Label>

                  <Controller
                    name="code"
                    control={controlCode}
                    render={({ field }) => (
                      <div className="space-y-3">
                        <Input
                          id="verification-code"
                          name="code"
                          type="text"
                          tabIndex={-1}
                          pattern="[0-9]*"
                          aria-hidden="true"
                          className="sr-only"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={field.value}
                          onChange={(e) => {
                            const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                            field.onChange(next);
                          }}
                        />

                        <OTPInput
                          length={4}
                          value={field.value}
                          disabled={isLoading}
                          name="verification-code"
                          onChange={field.onChange}
                          error={!!errorsCode.code}
                          idPrefix="verification-code"
                        />
                      </div>
                    )}
                  />

                  {errorsCode.code && (
                    <p role="alert" aria-live="polite" className="text-sm text-destructive text-center">
                      {errorsCode.code.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>Verificando <LoadingSpinner /></>
                  ) : (
                    <>Verificar <ArrowRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <div className="space-y-2 text-center">
                <Button
                  variant="ghost"
                  disabled={isLoading}
                  onClick={handleBackToEmailForm}
                  className="w-full text-sm"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao email
                </Button>

                <p className="text-sm text-muted-foreground">
                  {resendCountdown > 0 ? (
                    <>Não recebeu? Reenviar em {formatCountdown(resendCountdown)}</>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-sm h-auto p-0 underline-offset-4 hover:underline"
                    >
                      Reenviar email
                    </Button>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
