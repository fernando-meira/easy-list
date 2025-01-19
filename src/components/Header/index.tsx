'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/context/CategoryContext';
import { NewCategoryDrawer, NewProductForm, ThemeToggle } from '@/components';

export function Header() {
  const { isLoadingCategories } = useCategories();

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

  return (
    <header className="fixed top-0 flex items-center z-10 justify-between w-full p-4 space-x-4 border-b bg-white/80 dark:bg-background max-w-3xl mx-auto shadow-sm">
      <div className='flex items-center gap-2'>
        <Button
          size="icon"
          title="Sair"
          variant="ghost"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
        </Button>

        <ThemeToggle />
      </div>

      <div className="flex items-center gap-2">
        {isLoadingCategories ? (
          <div className="flex items-center gap-2 animate-pulse">
            <Skeleton className="h-9 w-28" />

            <Skeleton className="h-9 w-9" />
          </div>
        ) : (
          <>
            <NewCategoryDrawer />

            <NewProductForm />
          </>
        )}
      </div>
    </header>
  );
}
