'use client';

import { useState } from 'react';

import { z } from 'zod';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Mail, Sparkles } from 'lucide-react';

import { useUser } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

type EmailFormData = z.infer<typeof emailSchema>;

const codeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(4, 'O código deve ter 4 caracteres'),
});

type CodeFormData = z.infer<typeof codeSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setInitialEmail } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');

  useAuth(false);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
    setValue: setCodeValue,
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const sendLoginEmail = async (data: EmailFormData) => {
    setInitialEmail(data.email);
    setCurrentEmail(data.email);
    setCodeValue('email', data.email);

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/send-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao enviar email');
      }

      setShowCodeForm(true);
      toast.success('Email enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      toast.error('Erro ao enviar email. Tente novamente.');

      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (data: CodeFormData) => {
    try {
      setIsLoading(true);

      const verifyResponse = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          code: data.code,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Código inválido');
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
        console.error(error.message);
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Header isSimple />

      <div className="w-full max-w-md">
        <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-black/10 p-8 space-y-8">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              Bem-vindo ao Easy List
            </h1>

            {!showCodeForm ? (
              <p className="text-base text-muted-foreground/80">
                Digite seu email para acessar sua conta
              </p>
            ) : (
              <p className="text-base text-muted-foreground/80">
                Enviamos um email para <strong className="text-foreground font-semibold">{currentEmail}</strong> com um link e um código de acesso
              </p>
            )}
          </div>

          {!showCodeForm ? (
            <form onSubmit={handleSubmitEmail(sendLoginEmail)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>

                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                  <Input
                    autoFocus
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 h-11 bg-background/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                    {...registerEmail('email')}
                  />
                </div>

                {errorsEmail.email && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errorsEmail.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    Enviando <LoadingSpinner />
                  </>
                ) : (
                  <>
                    Continuar <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground/90">
                  Você receberá um email com:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10">
                      <Mail className="w-3 h-3 text-primary" />
                    </div>
                    Um link para acesso direto
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    Um código de 4 caracteres
                  </li>
                </ul>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-border/50 bg-muted/30 p-5 space-y-3">
                <p className="text-sm font-medium text-foreground/90">
                  Você pode acessar de duas formas:
                </p>
                <ol className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Clicando no link enviado no email</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Digitando o código de 4 caracteres abaixo</span>
                  </li>
                </ol>
              </div>

              <form onSubmit={handleSubmitCode(verifyCode)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Código de verificação
                  </Label>

                  <Input
                    id="code"
                    type="text"
                    maxLength={4}
                    placeholder="XXXX"
                    autoFocus
                    className="text-center text-3xl tracking-[0.5em] font-bold uppercase h-16 bg-background/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                    {...registerCode('code')}
                  />

                  {errorsCode.code && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errorsCode.code.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      Verificando <LoadingSpinner />
                    </>
                  ) : (
                    <>
                      Verificar código <Check className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <Button
                variant="outline"
                className="w-full h-10 hover:bg-accent/50 transition-colors"
                onClick={handleBackToEmailForm}
                disabled={isLoading}
              >
                Voltar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
