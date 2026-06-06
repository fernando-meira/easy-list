'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Sun, Moon, LogIn, LogOut, ShoppingBasket } from 'lucide-react';

import { PagesEnum } from '@/types/enums';
import { UserAvatar } from '@/components/user-avatar';

export function Header() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const firstName =
    session?.user?.name?.split(' ')[0] ??
    session?.user?.email?.split('@')[0] ??
    '';
  const email = session?.user?.email ?? '';
  const isLoggedIn = Boolean(session?.user);

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between h-14 px-3 bg-[var(--color-canvas)] border-b border-[var(--color-hairline)] max-w-3xl mx-auto">
      {isLoggedIn ? (
        <div className="flex items-center gap-2">
          <UserAvatar
            name={session?.user?.name}
            email={session?.user?.email}
            image={session?.user?.image}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold leading-none text-[var(--color-ink)]">
              Olá, {firstName}
            </span>
            <span className="text-[11px] leading-none text-[var(--color-muted)]">
              {email}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[var(--color-ink)] flex items-center justify-center flex-shrink-0">
            <ShoppingBasket className="w-4 h-4 text-[var(--color-canvas)]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold leading-none text-[var(--color-ink)]">
              EasyList
            </span>
            <span className="text-[11px] leading-none text-[var(--color-muted)]">
              Organize suas compras
            </span>
          </div>
        </div>
      )}

      {/* Right: theme toggle + logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] flex items-center justify-center"
          aria-label="Alternar tema"
        >
          {mounted && (resolvedTheme === 'dark'
            ? <Sun className="w-4 h-4 text-[var(--color-ink)]" />
            : <Moon className="w-4 h-4 text-[var(--color-ink)]" />)}
        </button>

        {isLoggedIn ? (
          <button
            onClick={() => signOut()}
            className="w-9 h-9 rounded-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4 text-[var(--color-ink)]" />
          </button>
        ) : (
          <Link
            href={PagesEnum.login}
            className="h-9 rounded-full bg-[var(--color-ink)] px-3.5 flex items-center justify-center gap-1.5"
            aria-label="Entrar"
          >
            <LogIn className="w-[15px] h-[15px] text-[var(--color-canvas)]" />
            <span className="text-[13px] font-semibold leading-none text-[var(--color-canvas)]">
              Entrar
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
