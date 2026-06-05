'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const firstName =
    session?.user?.name?.split(' ')[0] ??
    session?.user?.email?.split('@')[0] ??
    '';
  const email = session?.user?.email ?? '';

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between h-14 px-3 bg-[var(--color-canvas)] border-b border-[var(--color-hairline)] max-w-3xl mx-auto">
      {/* Left: avatar placeholder + greeting */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] border border-[var(--color-hairline)] flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold leading-none text-[var(--color-ink)]">
            Olá, {firstName}
          </span>
          <span className="text-[11px] leading-none text-[var(--color-muted)]">
            {email}
          </span>
        </div>
      </div>

      {/* Right: theme toggle + logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] flex items-center justify-center"
          aria-label="Alternar tema"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-[var(--color-ink)]" />
            : <Moon className="w-4 h-4 text-[var(--color-ink)]" />}
        </button>

        <button
          onClick={() => signOut()}
          className="w-9 h-9 rounded-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] flex items-center justify-center"
          aria-label="Sair"
        >
          <LogOut className="w-4 h-4 text-[var(--color-ink)]" />
        </button>
      </div>
    </header>
  );
}
