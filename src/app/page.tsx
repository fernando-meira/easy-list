'use client';

import { Main } from '@/components/main';
import { Header } from '@/components/header';
import { MainContent } from '@/components/main-content';
import { CategoryCard } from '@/components/category-card';

export default function Home() {
  return (
    <Main>
      <Header />

      <MainContent>
        <CategoryCard />
      </MainContent>
    </Main>
  );
}
