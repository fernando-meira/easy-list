import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Skeleton } from './ui/skeleton';
import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CategoryCard() {
  const router = useRouter();
  const { categories, isLoadingCategories } = useCategories();

  const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryProps>();

  const renderContent = useMemo(() => {
    if (isLoadingCategories) {
      return Array.from({ length: 4 }).map((_, index) => (
        <div className='flex flex-col gap-2 mb-4' key={index}>
          <Skeleton className="h-24 w-full" />
        </div>
      ));
    }

    if (categories) {
      return categories.map(category => {
        return <Card
          key={category._id}
          className="w-full cursor-pointer mb-4"
          onClick={() => {
            router.push(`/category?id=${category._id}`);
          }}
        >
          <CardHeader>
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-col">
                <CardTitle>{category.name}</CardTitle>

                <CardDescription>Criado em: {format(new Date(category.createdAt), 'dd/MM/yyyy')}</CardDescription>
              </div>

              <div onClick={(e) => {
                e.stopPropagation();
                setSelectedCategory(category);
                setOpenRemoveDrawer(true);
              }} className="cursor-pointer">
                <Trash2 className="h-4 w-4 text-rose-500" />
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
      <h1 className="text-2xl font-bold mb-4">Categorias</h1>

      {renderContent}
    </main>
  );
}
