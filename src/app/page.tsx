'use client';

import { useAuth } from '@/hooks/useAuth';
import { CategoryList, Footer, Header, HomeLoading } from '@/components';

export default function Home() {
  const { status } = useAuth(true);

  if (status === 'loading') {
    return (
      <HomeLoading />
    );
  }

  return (
    <main className="flex flex-col m-auto row-start-2 items-center sm:items-start h-screen max-w-3xl">
      <Header />

      <div id="main-content" className="p-4 flex flex-col gap-4 w-full mt-20 pb-20">
        <CategoryList />
      </div>

      <Footer />
    </main>
  );
}
