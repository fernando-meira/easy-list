import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session && requireAuth) {
      router.push('/login');
    }

    if (session && !requireAuth) {
      router.push('/');
    }
  }, [session, status, requireAuth, router]);

  return { session, status };
}
