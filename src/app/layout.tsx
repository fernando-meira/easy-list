import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { ProductsContextProvider } from '@/context/ProductContext';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Easy Shop',
  description: 'Sua lista de compras inteligente',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={manrope.className}>
        <ProductsContextProvider>
          {children}
        </ProductsContextProvider>
      </body>
    </html>
  );
}
