'use client';

import { useState } from 'react';

import { z } from 'zod';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { KeyRound, MailCheck } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';

import { useUser } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { PagesEnum } from '@/types/enums';
import { Header } from '@/components/header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading-spinner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
    register: registerMagicLink,
    handleSubmit: handleSubmitMagicLink,
    formState: { errors: errorsMagicLink },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
    setValue: setCodeValue,
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const onSubmitMagicLink = async (data: LoginFormData) => {
    setInitialEmail(data.email);

    try {
      setIsLoading(true);

      const result = await signIn('email', {
        email: data.email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push(PagesEnum.verifyRequest);
    } catch (error) {
      toast.error('Erro ao enviar o link de acesso. Tente novamente.');

      if (error instanceof Error) {
        throw new Error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const requestCode = async (data: LoginFormData) => {
    setInitialEmail(data.email);
    setCurrentEmail(data.email);
    setCodeValue('email', data.email);

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao solicitar código');
      }

      setShowCodeForm(true);
      toast.success('Código enviado para seu email!');
    } catch (error) {
      toast.error('Erro ao enviar o código. Tente novamente.');

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

      // Verificar o código no backend
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

      // Se o código for válido, fazer login com credenciais
      const signInResult = await signIn('verification-code', {
        email: data.email,
        code: data.code,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Redirecionar para a página inicial
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Header isSimple />

      <div className="w-full max-w-md p-4 space-y-4 bg-card">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Bem-vindo ao Easy List</h1>

          {!showCodeForm ? (
            <p className="text-muted-foreground">
              Escolha como deseja acessar sua conta
            </p>
          ) : (
            <p className="text-muted-foreground">
              Digite o código de 4 caracteres enviado para {currentEmail}
            </p>
          )}
        </div>

        {!showCodeForm ? (
          <Tabs defaultValue="magic-link" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
            </TabsList>

            <TabsContent value="magic-link" className="mt-4">
              <form onSubmit={handleSubmitMagicLink(onSubmitMagicLink)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-magic-link">Email</Label>

                  <Input
                    id="email-magic-link"
                    type="email"
                    placeholder="email@email.com"
                    {...registerMagicLink('email')}
                  />

                  {errorsMagicLink.email && (
                    <p className="text-sm text-destructive">{errorsMagicLink.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>Enviando <LoadingSpinner /></>
                  ) : (
                    <>Enviar link <MailCheck className="ml-2" /></>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <form onSubmit={handleSubmitMagicLink(requestCode)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-code">Email</Label>

                  <Input
                    id="email-code"
                    type="email"
                    placeholder="email@email.com"
                    {...registerMagicLink('email')}
                  />

                  {errorsMagicLink.email && (
                    <p className="text-sm text-destructive">{errorsMagicLink.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>Enviando <LoadingSpinner /></>
                  ) : (
                    <>Receber código <KeyRound className="ml-2" /></>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSubmitCode(verifyCode)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificação</Label>

                <Input
                  id="code"
                  type="text"
                  maxLength={4}
                  placeholder="XXXX"
                  className="text-center text-lg tracking-widest"
                  {...registerCode('code')}
                />

                {errorsCode.code && (
                  <p className="text-sm text-destructive">{errorsCode.code.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>Verificando <LoadingSpinner /></>
                ) : (
                  <>Verificar código</>
                )}
              </Button>
            </form>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleBackToEmailForm}
              disabled={isLoading}
            >
              Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
