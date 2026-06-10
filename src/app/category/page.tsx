import { Suspense } from 'react';
import type { Metadata } from 'next';

import { Main } from '@/components/main';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';

import { CategoryClient } from './category-client';

export const metadata: Metadata = {
  robots: { index: false },
};

function CategorySkeleton() {
  return (
    <div className="w-full space-y-2 mt-14 p-4">
      <Skeleton className="h-9 w-28" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function Category() {
  return (
    <Main>
      <Header />

      <div className="w-full mt-14 p-4">
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryClient />
        </Suspense>
      </div>
    </Main>
  );
}
