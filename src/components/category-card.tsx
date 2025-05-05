import React, { useCallback, useEffect } from 'react';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isBefore, subWeeks } from 'date-fns';

import { Badge } from './ui/badge';
import PageTitle from './page-title';
import { Skeleton } from './ui/skeleton';
import { useCategories } from '@/context';
import { Button } from '@/components/ui/button';
import { CategoryProps } from '@/types/interfaces';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';

export function CategoryCard() {
  const router = useRouter();
  const { categories, isLoadingCategories } = useCategories();

  const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
  const [olderCategories, setOlderCategories] = React.useState<CategoryProps[]>();
  const [recentCategories, setRecentCategories] = React.useState<CategoryProps[]>();
  const [selectedCategoryToRemove, setSelectedCategoryToRemove] = React.useState<CategoryProps>();

  const isOlderThanAWeek = (updatedAt: Date): boolean => {
    const oneWeekAgo = subWeeks(new Date(), 1);
    return isBefore(updatedAt, oneWeekAgo);
  };

  const handleRemoveClick = (category: CategoryProps) => {
    setSelectedCategoryToRemove(category);
    setOpenRemoveDrawer(true);
  };

  useEffect(() => {
    if (!categories) return;

    const categorizeItems = () => {
      const recent: CategoryProps[] = [];
      const older: CategoryProps[] = [];

      categories.forEach(category => {
        const isCategoryRecent = !isOlderThanAWeek(new Date(category.updatedAt));

        const hasRecentProducts = category.products?.some(
          product => !isOlderThanAWeek(new Date(product.updatedAt))
        );

        if (isCategoryRecent || hasRecentProducts) {
          recent.push(category);
        }

        if (!isCategoryRecent && !hasRecentProducts) {
          older.push(category);
        }
      });

      setRecentCategories(recent);
      setOlderCategories(older);
    };

    categorizeItems();
  }, [categories]);

  const renderContent = useCallback((renderCategories: CategoryProps[]) => {
    if (isLoadingCategories) {
      return Array.from({ length: 4 }).map((_, index) => (
        <div className='flex flex-col gap-2 mt-4' key={index}>
          <Skeleton className="h-16 w-full" />
        </div>
      ));
    }

    if (renderCategories) {
      return renderCategories.map(category => {
        return <Card
          key={category._id}
          className="w-full cursor-pointer mb-2 mt-2"
        >
          <CardHeader className='p-4' onClick={(e) => {
            e.preventDefault();
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
            className="w-full bg-secondary dark:bg-primary-foreground hover:bg-secondary dark:hover:bg-primary-foreground flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4 text-rose-500 dark:text-white" />
          </Button>
        </Card>;
      });
    }

    return null;
  }, [isLoadingCategories, router]);

  return (
    <main>
      <PageTitle title="Categorias" />

      {recentCategories && recentCategories.length > 0 && (
        <>
          <div className='my-4'>
            <p className="mb-2 text-sm">Atualizadas</p>
            {renderContent(recentCategories)}
          </div>

          {olderCategories && olderCategories.length > 0 && <Separator />}
        </>
      )}

      {olderCategories && olderCategories.length > 0 && (
        <div className='my-4'>
          <p className="mb-2 text-sm">Antigas</p>
          {renderContent(olderCategories)}
        </div>
      )}

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
