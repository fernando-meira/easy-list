import type { Metadata } from 'next';

import { Main } from '@/components/main';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { MainContent } from '@/components/main-content';
import { CategoryCard } from '@/components/category-card';

export const metadata: Metadata = {
  title: 'Easy List — Sua lista de compras inteligente',
  description: 'Organize suas compras de forma simples e compartilhe listas com sua família ou amigos.',
  openGraph: {
    title: 'Easy List — Sua lista de compras inteligente',
    description: 'Organize suas compras de forma simples e compartilhe listas com sua família ou amigos.',
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Home() {
  return (
    <Main>
      <Header />

      <MainContent>
        <CategoryCard />
      </MainContent>

      <Footer />
    </Main>
  );
}
