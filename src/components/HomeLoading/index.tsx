import { Skeleton } from '@/components/ui/skeleton';

export const HomeLoading = () => {
  return (<main className="flex flex-col p-4 max-w-3xl m-auto">
    <header className="flex pb-4 items-center justify-between w-full border-b max-w-3xl">
      <div className='flex items-center gap-2 bottom-0'>
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>

      <div className='flex items-center gap-2'>
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-9" />
      </div>
    </header>

    <div className="py-4 flex gap-4 w-full">
      <div className='flex flex-col gap-2'>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className='flex flex-col gap-2'>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
    </div>

    <div className="flex items-center space-x-4 mt-4">
      <div className="space-y-2 w-full">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>

    <div className="flex items-center space-x-4 mt-4">
      <Skeleton className="h-9 w-40" />
    </div>
  </main>);
};
