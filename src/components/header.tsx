'use client';

import { useMemo } from 'react';
import { HomeIcon, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { useCategories } from '@/context/CategoryContext';

import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { useSignOut } from '@/hooks/useSignOut';
import { NewProductForm } from './new-product-form';
import { NewCategoryDrawer } from './new-category-drawer';

interface HeaderProps {
  isSimple?: boolean;
}

export function Header({ isSimple }: HeaderProps) {
  const { isLoadingCategories } = useCategories();
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === '/';

  const headerContent = useMemo(() => {
    const commonHeaderClass =
      'fixed top-0 flex items-center z-10 justify-between w-full p-3 border-b bg-white dark:bg-background max-w-3xl mx-auto';

    if (isSimple) {
      return (
        <header className={commonHeaderClass}>
          <div className="flex items-center gap-2 w-full justify-end">
            <ThemeToggle />
          </div>
        </header>
      );
    }

    return (
      <header className={commonHeaderClass}>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            title="Sair"
            variant="ghost"
            onClick={useSignOut}
          >
            <LogOut />
          </Button>

          <ThemeToggle />

          {!isHomePage && (
            <Button
              size="icon"
              title="Home"
              variant="ghost"
              onClick={() => router.push('/')}
            >
              <HomeIcon />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoadingCategories ? (
            <div className="flex items-center gap-2 animate-pulse">
              <Skeleton className="h-9 w-28" />
            </div>
          ) : (
            <>
              {!isHomePage ? (
                <NewProductForm />
              ): <NewCategoryDrawer />}
            </>
          )}
        </div>
      </header>
    );
  }, [isLoadingCategories, isSimple, router, isHomePage]);

  return headerContent;
}
