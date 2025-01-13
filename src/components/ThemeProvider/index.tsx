'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

function ThemeMetaEffect() {
  const { theme } = useTheme();

  React.useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#09090b' : '#ffffff');
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'theme-color';
      newMeta.content = theme === 'dark' ? '#09090b' : '#ffffff';
      document.head.appendChild(newMeta);
    }
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeMetaEffect />

      {children}
    </NextThemesProvider>
  );
}
