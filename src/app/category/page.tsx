'use client';

import { Suspense } from 'react';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CategoryClient } from './category-client';
import { Skeleton } from '@/components/ui/skeleton';

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
    <main className="flex flex-col m-auto row-start-2 items-center sm:items-start h-screen max-w-3xl pb-14">
      <Header />

      <Suspense fallback={<CategorySkeleton />}>
        <CategoryClient />
      </Suspense>

      <Footer />
    </main>
  );
}
