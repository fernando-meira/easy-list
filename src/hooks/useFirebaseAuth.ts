'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signInWithCustomToken } from 'firebase/auth';

import { auth } from '@/lib/firebase-client';
import { AuthStatusEnum } from '@/types/enums';

export function useFirebaseAuth() {
  const { status: sessionStatus } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (sessionStatus !== AuthStatusEnum.authenticated) return;

    let cancelled = false;

    async function authenticate() {
      try {
        const response = await fetch('/api/auth/firebase-token');

        if (!response.ok) {
          if (!cancelled) setIsError(true);
          return;
        }

        const { token } = await response.json();

        await signInWithCustomToken(auth, token);

        if (!cancelled) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Firebase auth failed:', error);
        if (!cancelled) setIsError(true);
      }
    }

    authenticate();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  return { isReady, isError };
}
