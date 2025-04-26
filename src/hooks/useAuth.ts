import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isRedirectingRef = useRef(false);

  useEffect(() => {
    if (status === 'loading' || isRedirectingRef.current) return;

    if (status === 'authenticated' && requireAuth) return;

    if (status === 'unauthenticated' && requireAuth && !isRedirectingRef.current) {
      isRedirectingRef.current = true;

      router.push('/login');

      return;
    }

    if (status === 'authenticated' && !requireAuth && !isRedirectingRef.current) {
      isRedirectingRef.current = true;

      router.push('/');

      return;
    }
  }, [session, status, requireAuth, router]);

  useEffect(() => {
    return () => {
      isRedirectingRef.current = false;
    };
  }, []);

  return { session, status };
}
