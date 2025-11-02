import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';

import './globals.css';

import { AuthProvider } from '@/providers/session';
import { ThemeProvider } from '@/components/theme-provider';
import { CategoriesContextProvider, ProductsContextProvider, UserContextProvider } from '@/context';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Easy List',
  description: 'Sua lista de compras inteligente',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
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
            <UserContextProvider>
              <CategoriesContextProvider>
                <ProductsContextProvider>
                  <Toaster />

                  {children}
                </ProductsContextProvider>
              </CategoriesContextProvider>
            </UserContextProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
