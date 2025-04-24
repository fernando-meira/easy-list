'use client';

import { Suspense } from 'react';

import { Main } from '@/components/main';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CategoryClient } from './category-client';
import { Skeleton } from '@/components/ui/skeleton';
import { MainContent } from '@/components/main-content';

function CategorySkeleton() {
  return (
    <div className="w-full space-y-2 mt-20 p-4">
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

      <Suspense fallback={<CategorySkeleton />}>
        <MainContent>
          <CategoryClient />
        </MainContent>
      </Suspense>

      <Footer />
    </Main>
  );
}
