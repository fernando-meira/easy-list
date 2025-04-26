'use client';

import { Main } from '@/components/main';
// import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/header';
// import { AuthStatusEnum } from '@/types/enums';
// import { HomeLoading } from '@/components/home-loading';
import { MainContent } from '@/components/main-content';
import { CategoryCard } from '@/components/category-card';

export default function Home() {
  // const { status } = useAuth(true);

  // if (status === AuthStatusEnum.loading) {
  //   return (
  //     <HomeLoading />
  //   );
  // }

  return (
    <Main>
      <Header />

      <MainContent>
        <CategoryCard />
      </MainContent>
    </Main>
  );
}
