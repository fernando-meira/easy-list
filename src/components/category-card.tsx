import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from './ui/badge';
import PageTitle from './page-title';
import { Skeleton } from './ui/skeleton';
import { useCategories } from '@/context';
import { Button } from '@/components/ui/button';
import { CategoryProps } from '@/types/interfaces';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';

export function CategoryCard() {
  const router = useRouter();
  const { categories, isLoadingCategories } = useCategories();

  const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
  const [selectedCategoryToRemove, setSelectedCategoryToRemove] = React.useState<CategoryProps>();

  const handleRemoveClick = (category: CategoryProps) => {
    setSelectedCategoryToRemove(category);
    setOpenRemoveDrawer(true);
  };

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
        >
          <CardHeader className='p-4' onClick={() => {
            router.push(`/category?id=${category._id}`);
          }}>
            <div className="flex flex-row justify-between items-center">
              <CardTitle>{category.name}</CardTitle>

              <div className='flex gap-2'>
                {category.products?.length ? <Badge variant="secondary" className="text-xs">{category.products?.length} produtos</Badge> : null}
              </div>

            </div>
          </CardHeader>

          <Button
            onClick={() => handleRemoveClick(category)}
            className="w-full bg-rose-100 dark:bg-primary-foreground hover:bg-rose-100 dark:hover:bg-primary-foreground flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4 text-rose-500 dark:text-white" />
          </Button>
        </Card>;
      });
    }

    return null;
  }, [categories, isLoadingCategories, router]);

  return (
    <main>
      <PageTitle title="Categorias" />

      {renderContent}

      {selectedCategoryToRemove && (
        <ConfirmRemoveCategoryDrawer
          open={openRemoveDrawer}
          onOpenChange={setOpenRemoveDrawer}
          category={selectedCategoryToRemove}
        />
      )}
    </main>
  );
}
