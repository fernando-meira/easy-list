'use client';

import { useState } from 'react';

import { z } from 'zod';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useAuth(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);

      const result = await signIn('email', {
        email: data.email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push('/verify-request');
    } catch (error) {
      toast.error('Erro ao enviar o link de acesso. Tente novamente.');

      if (error instanceof Error) {
        throw new Error(error.message);
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Header isSimple />

      <div className="w-full max-w-md p-4 space-y-4 bg-card">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Bem-vindo ao Easy List</h1>

          <p className="text-muted-foreground">
            Digite seu email para receber um link de acesso
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
            />

            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <>Enviando <LoadingSpinner /></> : <>Enviar link <MailCheck /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
