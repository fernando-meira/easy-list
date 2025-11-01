'use client';

import { useMemo } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Button } from './ui/button';
import { PagesEnum } from '@/types/enums';
import { ThemeToggle } from './theme-toggle';
import { useSession } from 'next-auth/react';
import { useSignOut } from '@/hooks/useSignOut';

interface HeaderProps {
  isSimple?: boolean;
}

export function Header({ isSimple }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isVerifyRequestPage = pathname === PagesEnum.verifyRequest;

  const headerContent = useMemo(() => {
    const commonHeaderClass =
      'fixed top-0 flex items-center z-10 justify-between w-full p-3 border-b bg-white dark:bg-background max-w-3xl mx-auto';

    if (isSimple) {
      return (
        <header className={commonHeaderClass}>
          {isVerifyRequestPage && (
            <ArrowLeft className="cursor-pointer" onClick={() => router.push(PagesEnum.login)} />
          )}
          <div className="ml-auto">
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
  }, [isSimple, session, isVerifyRequestPage, router]);

  return headerContent;
}
