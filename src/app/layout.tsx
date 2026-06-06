import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

import { Toaster } from '@/components/ui/sonner';

import './globals.css';

import { AuthProvider } from '@/providers/session';
import { ThemeProvider } from '@/components/theme-provider';
import { UserContextProvider, ProductsContextProvider, CategoriesContextProvider } from '@/context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Easy List',
  description: 'Sua lista de compras inteligente',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="font-sans" suppressHydrationWarning>
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
