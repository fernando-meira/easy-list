import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthStatusEnum, PagesEnum } from '@/types/enums';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isRedirectingRef = useRef(false);

  useEffect(() => {
    if (status === AuthStatusEnum.loading || isRedirectingRef.current) return;

    if (status === AuthStatusEnum.authenticated && requireAuth) return;

    if (status === AuthStatusEnum.unauthenticated && requireAuth && !isRedirectingRef.current) {
      isRedirectingRef.current = true;

      router.push(PagesEnum.login);

      return;
    }

    if (status === AuthStatusEnum.authenticated && !requireAuth && !isRedirectingRef.current) {
      isRedirectingRef.current = true;

      router.push(PagesEnum.home);

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
