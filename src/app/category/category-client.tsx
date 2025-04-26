'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useCategories } from '@/context';
import { ProductProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsList } from '@/components/product-list';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { CategorySelect } from '@/components/category-select';
import { ProductManagerSheet } from '@/components/product-manager-sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function CategoryClient() {
  const searchParams = useSearchParams();
  const { setSelectedCategoryId, filteredCategory } = useCategories();

  const categoryId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [openEditSheet, setOpenEditSheet] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductProps>({} as ProductProps);

  useEffect(() => {
    if (!categoryId) return;

    setSelectedCategoryId(categoryId);
    setIsLoading(false);
  }, [categoryId, setSelectedCategoryId]);

  const renderContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="w-full space-y-2 mt-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    return filteredCategory ? (
      <div>
        <div className="mt-4">
          {filteredCategory.products && filteredCategory.products.length > 0 ? (
            <ProductsList
              category={filteredCategory}
              setOpenEditSheet={setOpenEditSheet}
              setSelectedProducts={setSelectedProducts}
            />
          ) : (
            <p>Nenhum produto cadastrado nesta categoria.</p>
          )}
        </div>

        <ProductManagerSheet
          open={openEditSheet}
          product={selectedProducts}
          onOpenChange={setOpenEditSheet}
          type={AddOrEditProductTypeEnum.edit}
        />
      </div>
    ) : (
      <p>Categoria não encontrada.</p>
    );
  }, [filteredCategory, isLoading, openEditSheet, selectedProducts]);

  return (
    <main>
      <div className="flex items-center gap-2 justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>

            {filteredCategory?.name &&
              <>
                <BreadcrumbSeparator />

                <BreadcrumbItem>
                  <BreadcrumbPage>{filteredCategory.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            }
          </BreadcrumbList>
        </Breadcrumb>

        <CategorySelect />
      </div>

      {renderContent}

    </main>
  );
}
