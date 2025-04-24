import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from './ui/badge';
import PageTitle from './page-title';
import { Skeleton } from './ui/skeleton';
import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';

export function CategoryCard() {
  const router = useRouter();
  const { categories, isLoadingCategories } = useCategories();

  const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryProps>();

  const renderContent = useMemo(() => {
    if (isLoadingCategories) {
      return Array.from({ length: 4 }).map((_, index) => (
        <div className='flex flex-col gap-2 mt-4' key={index}>
          <Skeleton className="h-16 w-full" />
        </div>
      ));
    }

    if (categories) {
      return categories.map(category => {
        return <Card
          key={category._id}
          className="w-full cursor-pointer mb-2 mt-2"
          onClick={() => {
            router.push(`/category?id=${category._id}`);
          }}
        >
          <CardHeader className='p-4'>
            <div className="flex flex-row justify-between items-center">
              <CardTitle>{category.name}</CardTitle>

              <div className='flex gap-2'>
                {category.products?.length ? <Badge variant="secondary" className="text-xs">{category.products?.length} produtos</Badge> : null}

                <div onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(category);
                  setOpenRemoveDrawer(true);
                }} className="flex gap-2 bg-rose-100 dark:bg-background p-2 rounded cursor-pointer">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </div>

              </div>

            </div>
          </CardHeader>

          <ConfirmRemoveCategoryDrawer item={selectedCategory} open={openRemoveDrawer} onOpenChange={setOpenRemoveDrawer} />
        </Card>;
      });
    }

    return [];
  }, [categories, isLoadingCategories, openRemoveDrawer, router, selectedCategory]);

  return (
    <main>
      <PageTitle title="Categorias" />

      {renderContent}
    </main>
  );
}
