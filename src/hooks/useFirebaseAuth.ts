'use client';

import { signInWithCustomToken } from 'firebase/auth';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { auth } from '@/lib/firebase-client';
import { AuthStatusEnum } from '@/types/enums';

export function useFirebaseAuth() {
  const { status: sessionStatus } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (sessionStatus !== AuthStatusEnum.authenticated) return;

    let cancelled = false;

    async function authenticate() {
      try {
        const response = await fetch('/api/auth/firebase-token');

        if (!response.ok) return;

        const { token } = await response.json();

        await signInWithCustomToken(auth, token);

        if (!cancelled) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Firebase auth failed:', error);
      }
    }

    authenticate();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  return { isReady };
}
