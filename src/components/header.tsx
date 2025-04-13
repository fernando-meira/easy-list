'use client';

import { LogOut } from 'lucide-react';
import { useMemo } from 'react';

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

  const headerContent = useMemo(() => {
    const commonHeaderClass =
      'fixed top-0 flex items-center z-10 justify-between w-full p-4 border-b bg-white/80 dark:bg-background max-w-3xl mx-auto';

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
  }, [isLoadingCategories, isSimple]);

  return headerContent;
}
