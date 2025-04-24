'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useCategories } from '@/context';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsList } from '@/components/product-list';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { CategorySelect } from '@/components/category-select';
import { CategoryProps, ProductProps } from '@/types/interfaces';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories, isLoadingCategories, setSelectedCategoryId } = useCategories();

  const categoryId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(true);
  const [openEditSheet, setOpenEditSheet] = useState<boolean>(false);
  const [category, setCategory] = useState<CategoryProps | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductProps>({} as ProductProps);

  useEffect(() => {
    if (!categoryId) {
      router.push('/');
      return;
    }

    setSelectedCategoryId(categoryId);

    if (isLoadingCategories) {
      return;
    }

    if (categories && categories.length > 0) {
      const foundCategory = categories.find(category => category._id === categoryId);

      if (!foundCategory) {
        router.push('/');
        return;
      }

      setCategory(foundCategory);
    } else {
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [categoryId, categories, isLoadingCategories, router, setSelectedCategoryId]);

  const renderContent = useMemo(() => {
    if (isLoading || isLoadingCategories) {
      return (
        <div className="w-full space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    return category ? (
      <div>
        <div className="flex items-center gap-2 justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <CategorySelect />
        </div>

        <div className="mt-4">
          {category.products && category.products.length > 0 ? (
            <ProductsList
              category={category}
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
  }, [category, isLoading, isLoadingCategories, openEditSheet, selectedProducts]);

  return renderContent;
}
