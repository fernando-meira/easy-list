import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { data: session, status } = useSession();

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
