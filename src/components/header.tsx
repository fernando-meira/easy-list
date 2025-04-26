'use client';

import { useMemo } from 'react';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useCategories } from '@/context/CategoryContext';

import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { useSession } from 'next-auth/react';
import { useSignOut } from '@/hooks/useSignOut';
import { NewProductForm } from './new-product-form';
import { NewCategoryDrawer } from './new-category-drawer';

interface HeaderProps {
  isSimple?: boolean;
}

export function Header({ isSimple }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isLoadingCategories } = useCategories();

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src='https://avatar.iran.liara.run/public' />

                  <AvatarFallback>{session?.user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>

              <TooltipContent>
                <p>{session?.user?.email || 'Usuário'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
        </div>

        <div>
          <ThemeToggle />

          <Button
            size="icon"
            title="Sair"
            variant="ghost"
            onClick={useSignOut}
          >
            <LogOut />
          </Button>
        </div>
      </header>
    );
  }, [isLoadingCategories, isSimple, isHomePage, session]);

  return headerContent;
}
