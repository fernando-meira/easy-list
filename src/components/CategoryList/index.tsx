'use client';

import React, { useMemo } from 'react';

import { Button } from '../ui/button';
import { useCategories } from '@/context';
import { ChevronsUpDown } from 'lucide-react';
import { ProductProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/context/ProductContext';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { ConfirmCleanProductListDrawer, ProductListHeader, ProductManagerSheet, ProductsList } from '@/components';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

export function CategoryList() {
  const { isLoading } = useProducts();
  const { categories, filteredCategory } = useCategories();

  const [openEditSheet, setOpenEditSheet] = React.useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = React.useState<ProductProps | undefined>(undefined);
  const [openCollapsible, setOpenCollapsible] = React.useState<{categoryId: string; open: boolean}>({ categoryId: '', open: false });

  const renderCategoriesWithProducts = useMemo(() => {
    if (isLoading) {
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
        <div className="space-y-2 mt-4 rounded-md border font-mono text-sm shadow-sm">
          <ProductsList category={filteredCategory} setOpenEditSheet={setOpenEditSheet} setSelectedProducts={setSelectedProducts} />
        </div>
      );}

    return (
      <div className="flex flex-col mt-4">
        <div>
          {categories?.map((category) => category?.products && category?.products?.length > 0 && (
            <Collapsible
              key={category._id}
              open={openCollapsible.categoryId === category._id && openCollapsible.open}
              onOpenChange={openCollapsible.categoryId === category._id ? (open: boolean) => setOpenCollapsible({ ...openCollapsible, open }) : (open: boolean) => setOpenCollapsible({ categoryId: category._id, open })}
              className="space-y-2 gap-2 [&:not(:first-child)]:mt-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-4"
            >
              <div className="flex items-center justify-between space-x-4">
                <h4 className="text-sm font-semibold">
                  {category.name}
                </h4>

                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronsUpDown className="h-4 w-4" />

                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-2 rounded-md border font-mono text-sm shadow-sm">
                <ProductsList category={category} setOpenEditSheet={setOpenEditSheet} setSelectedProducts={setSelectedProducts} />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    );
  }, [categories, isLoading, openCollapsible, filteredCategory]);

  return (
    <div className="w-full">
      <ProductListHeader />

      {renderCategoriesWithProducts}

      <ProductManagerSheet
        open={openEditSheet}
        product={selectedProducts}
        onOpenChange={setOpenEditSheet}
        type={AddOrEditProductTypeEnum.edit}
      />

      <ConfirmCleanProductListDrawer />
    </div>
  );
}
