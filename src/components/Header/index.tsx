'use client';

import Image from 'next/image';

import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/context/ProductContext';
import {  NewCategoryDrawer, NewProductForm, ThemeToggle } from '@/components';

export function Header() {
  const { isLoading } = useProducts();

  return (
    <header className="fixed top-0 flex items-center justify-between w-full p-4 space-x-4 border-b bg-white/80 dark:bg-muted/50 backdrop-blur-sm max-w-3xl mx-auto shadow-sm">
      <div className='flex items-center gap-2'>
        <Image
          priority
          width={24}
          height={24}
          src="/logo.png"
          alt="Easy Shop Logo"
          className="dark:invert"
        />

        <ThemeToggle />
      </div>

      <div className="flex items-center gap-2">
        {isLoading ? (
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
