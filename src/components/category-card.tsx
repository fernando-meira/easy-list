import React from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Skeleton } from './ui/skeleton';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';

export function CategoryCard() {
  const { categories, isLoadingCategories } = useCategories();
  const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryProps>();

  if (isLoadingCategories) {
    return Array.from({ length: 6 }).map((_, index) => (
      <Skeleton key={index} className="h-9 w-full" />
    ));
  }

  if (categories) {
    return categories.map(category => {
      return <Card key={category._id} className="w-full cursor-pointer" onClick={() => console.log('redirecionar para a tela de categoria.', category._id)}>
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

}
