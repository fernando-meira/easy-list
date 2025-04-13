'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useCategories } from '@/context';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsList } from '@/components/product-list';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { CategoryProps, ProductProps } from '@/types/interfaces';
import { ProductManagerSheet } from '@/components/product-manager-sheet';
import { Footer } from '@/components/footer';

export default function Category() {
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
      const foundCategory = categories.find(cat => cat._id === categoryId);

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

  if (isLoading || isLoadingCategories) {
    return (
      <main className="flex flex-col m-auto row-start-2 items-center sm:items-start h-screen max-w-3xl p-4">
        <div className="w-full space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col m-auto row-start-2 items-center sm:items-start h-screen max-w-3xl">
      <Header />

      {category ? (
        <div className="w-full mt-20">
          <h1 className="text-2xl font-bold mb-4">{category.name}</h1>

          <div className="mt-6">
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
      )}

      <Footer />
    </main>
  );
}
