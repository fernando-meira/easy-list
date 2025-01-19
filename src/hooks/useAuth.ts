import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      await signOut({ redirect: true, callbackUrl: '/login' });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }

      await signOut({ redirect: true, callbackUrl: '/login' });
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session && requireAuth) {
      router.push('/login');
    }

    if (session && !requireAuth) {
      router.push('/');
    }
  }, [session, status, requireAuth, router]);

  return { session, status, handleSignOut };
}
