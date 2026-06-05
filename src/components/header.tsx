'use client';

import { useMemo } from 'react';
import { LogOut } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { useSignOut } from '@/hooks/useSignOut';
import { getBiggestUsernamePart } from '@/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  isSimple?: boolean;
}

export function Header({ isSimple }: HeaderProps) {
  const { data: session } = useSession();

  const userName = session?.user?.email ? getBiggestUsernamePart(session.user.email) : undefined;

  const headerContent = useMemo(() => {
    const commonHeaderClass =
      'fixed top-0 flex items-center z-10 justify-between w-full px-4 h-16 border-b bg-background max-w-3xl mx-auto';

    if (isSimple) {
      return (
        <header className={commonHeaderClass}>
          <span className="text-base font-semibold">Easy List</span>
          <ThemeToggle />
        </header>
      );
    }

    return (
      <header className={commonHeaderClass}>
        <div className="flex flex-row gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback>{session?.user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>

              <TooltipContent>
                <p>{session?.user?.email || 'Usuário'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {userName && <p className="font-bold text-xs">{userName}</p>}
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
  }, [isSimple, session, userName]);

  return headerContent;
}
