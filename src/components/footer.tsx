'use client';

import { Skeleton } from './ui/skeleton';
import { PagesEnum } from '@/types/enums';
import { convertToCurrency } from '@/utils';
import { calculateTotalValue } from '@/utils';
import { usePathname } from 'next/navigation';
import { NewProductForm } from './new-product-form';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { NewCategoryDrawer } from './new-category-drawer';

export function Footer() {
  const pathname = usePathname();
  const { isLoadingCategories } = useCategories();
  const { products, allProductsWithoutPrice, allProductsInCartWithoutPrice } = useProducts();

  const isHomePage = pathname === PagesEnum.home;

  return (
    <footer className="fixed bottom-0 w-full m-auto border-t rounded-t-sm max-w-3xl bg-white dark:bg-background">
      {!!products && !isHomePage && (!allProductsWithoutPrice || !allProductsInCartWithoutPrice) && (<div className="p-4 flex justify-between gap-4 mx-auto">
        {!allProductsWithoutPrice && (
          <p className="font-semibold">Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}</p>
        )}

        {!allProductsInCartWithoutPrice && (
          <p className="font-semibold text-teal-400">Carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}</p>
        )}
      </div>)
      }

      <div className="flex items-center gap-2">
        {isLoadingCategories ? (
          <div className="flex items-center gap-2 animate-pulse">
            <Skeleton className="h-9 w-28" />
          </div>
        ) : (
          <>
            {!isHomePage ? (
              <NewProductForm />
            ): <NewCategoryDrawer />}
          </>
        )}
      </div>
    </footer>
  );
}
