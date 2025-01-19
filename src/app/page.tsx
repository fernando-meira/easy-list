'use client';

import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryList, Footer, Header } from '@/components';

export default function Home() {
  const { status } = useAuth(true);

  if (status === 'loading') {
    return (
      <div className="flex flex-col p-4 max-w-3xl">
        <div className="flex items-center gap-2 animate-pulse">
          <Skeleton className="h-9 w-28" />

          <Skeleton className="h-9 w-9" />
        </div>

        <div className="flex items-center space-x-4 mt-4">
          <div className="space-y-2 w-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </div>
      </div>
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
