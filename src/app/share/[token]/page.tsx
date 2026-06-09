'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Header } from '@/components/header';
import { LoadingSpinner } from '@/components/loading-spinner';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function join() {
      const { token } = await params;

      try {
        const response = await fetch(`/api/share/${token}`, { method: 'POST' });

        if (!response.ok) {
          setError(true);
          return;
        }

        const { categoryName } = await response.json();
        toast.success(`Você foi adicionado à lista ${categoryName}`);
        router.push('/');
      } catch {
        setError(true);
      }
    }

    join();
  }, [params, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Header />
        <p className="mt-4 text-sm text-destructive">Link inválido ou expirado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Header />
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <LoadingSpinner />
        <span>Entrando na lista...</span>
      </div>
    </div>
  );
}
