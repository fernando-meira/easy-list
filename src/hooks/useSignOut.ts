import { signOut } from 'next-auth/react';

export async function useSignOut() {
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
