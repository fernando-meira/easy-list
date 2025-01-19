import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';

import './globals.css';

import { ThemeProvider } from '@/components';
import { AuthProvider } from '@/providers/session';
import { CategoriesContextProvider, ProductsContextProvider } from '@/context';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Easy List',
  description: 'Sua lista de compras inteligente',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={manrope.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CategoriesContextProvider>
              <ProductsContextProvider>
                <Toaster />

                {children}
              </ProductsContextProvider>
            </CategoriesContextProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
