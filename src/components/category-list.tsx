'use client';

import React, { useMemo } from 'react';
import { ChevronsUpDown,  Trash2 } from 'lucide-react';

import { useCategories } from '@/context';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { CategoryProps, ProductProps } from '@/types/interfaces';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { ProductsList } from './product-list';
// import { ProductListHeader } from './product-list-header';
import { ProductManagerSheet } from './product-manager-sheet';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ConfirmDeleteAllProductListDrawer } from './confirm-delete-all-product-list-drawer';

export function CategoryList() {
  const { categories, filteredCategory, isLoadingCategories } = useCategories();

  const [openEditSheet, setOpenEditSheet] = React.useState<boolean>(false);
  const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryProps>();
  const [selectedProducts, setSelectedProducts] = React.useState<ProductProps | undefined>(undefined);
  const [openCollapsible, setOpenCollapsible] = React.useState<{categoryId: string; open: boolean}>({ categoryId: '', open: false });

  const categoryList = useMemo(() => {
    if (isLoadingCategories) {
      return (
        <div className="flex items-center space-x-4 mt-4">
          <div className="space-y-2 w-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </div>
      );
    }

    if (!categories || categories.length === 0) {
      return (
        <div className="flex items-center justify-center w-full h-[200px]">
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada</p>
        </div>
      );
    }

    if (!!filteredCategory && filteredCategory?.products?.length === 0 || !!filteredCategory && !filteredCategory?.products) {
      return (
        <div className="flex items-center justify-center w-full h-[200px]">
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado na categoria selecionada</p>
        </div>
      );
    }

    if (!!filteredCategory && filteredCategory?.products && filteredCategory.products?.length > 0) {
      return (
        <div className="mt-4 rounded-md border font-mono text-sm shadow-sm">
          <ProductsList category={filteredCategory} setOpenEditSheet={setOpenEditSheet} setSelectedProducts={setSelectedProducts} />
        </div>
      );}

    return (
      <div className="flex flex-col mt-4">
        <div>
          {categories?.map((category) => (
            <Collapsible
              key={category._id}
              open={openCollapsible.categoryId === category._id && openCollapsible.open}
              onOpenChange={openCollapsible.categoryId === category._id ? (open: boolean) => setOpenCollapsible({ ...openCollapsible, open }) : (open: boolean) => setOpenCollapsible({ categoryId: category._id, open })}
              className="space-y-2 gap-2 pb-4 border-b first:border-t [&(:first-child)]:pt-4"
            >
              <div className="flex items-center justify-between space-x-2">
                {categories?.length > 1 && (
                  <div onClick={() => {setSelectedCategory(category); setOpenRemoveDrawer(true);}} className="flex gap-2 bg-rose-100 dark:bg-background p-2 rounded cursor-pointer">
                    <Trash2 className="h-4 w-4 text-rose-500 " />
                  </div>
                )}

                <div className="flex flex-row gap-2 w-full justify-between">
                  <h4 className="text-md font-semibold">
                    {category.name}
                  </h4>

                  {category?.products && category?.products?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{category?.products?.length === 1 ? `${category.products?.length} produto` : `${category.products?.length} produtos`}</Badge>
                  )}

                </div>

                <CollapsibleTrigger asChild>
                  <Button className="flex gap-2 bg-secondary/80 p-2 rounded cursor-pointer" variant="ghost" size="sm">
                    <ChevronsUpDown className="h-4 w-4" />

                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="rounded-md border font-mono text-sm shadow-sm">
                <ProductsList category={category} setOpenEditSheet={setOpenEditSheet} setSelectedProducts={setSelectedProducts} />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

      </div>
    );
  }, [categories, isLoadingCategories, openCollapsible, filteredCategory]);

  return (
    <div className="w-full">
      {/* <ProductListHeader /> */}

      {categoryList}

      <ProductManagerSheet
        open={openEditSheet}
        product={selectedProducts}
        onOpenChange={setOpenEditSheet}
        type={AddOrEditProductTypeEnum.edit}
      />

      <ConfirmDeleteAllProductListDrawer />

      <ConfirmRemoveCategoryDrawer item={selectedCategory} open={openRemoveDrawer} onOpenChange={setOpenRemoveDrawer} />
    </div>
  );
}
