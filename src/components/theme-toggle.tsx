'use client';

import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const ThemeButton = ({
  toggleTheme,
  children,
}: {
  toggleTheme: () => void;
  children: ReactNode;
}) => {
  return (
    <Button
      size="icon"
      type="button"
      variant="ghost"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 text-muted-foreground ml-auto"
    >
      {children}
    </Button>
  );
};

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!mounted) {
    return (
      <ThemeButton toggleTheme={() => ({})}>
        <SunIcon />
      </ThemeButton>
    );
  }

  return (
    <ThemeButton toggleTheme={toggleTheme}>
      {theme === 'light' ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </ThemeButton>
  );
};
