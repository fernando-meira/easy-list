'use client';

import { PagesEnum } from '@/types/enums';
import { convertToCurrency } from '@/utils';
import { calculateTotalValue } from '@/utils';
import { usePathname } from 'next/navigation';
import { NewProductForm } from './new-product-form';
import { useProducts } from '@/context/ProductContext';
import { NewCategoryDrawer } from './new-category-drawer';

export function Footer() {
  const pathname = usePathname();
  const { products, allProductsWithoutPrice, allProductsInCartWithoutPrice } = useProducts();

  const isHomePage = pathname === PagesEnum.home;
  const shouldRenderPrice = !!products && !isHomePage && (!allProductsWithoutPrice || !allProductsInCartWithoutPrice);

  return (
    <footer className={'fixed bottom-0 w-full m-auto rounded-t-sm max-w-3xl bg-white dark:bg-background'}>
      {shouldRenderPrice && (<div className="p-4 flex justify-between gap-4 mx-auto">
        {!allProductsWithoutPrice && (
          <p className="font-semibold">Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}</p>
        )}

        {!allProductsInCartWithoutPrice && (
          <p className="font-semibold text-teal-400">Carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}</p>
        )}
      </div>)
      }

      <div className="flex items-center gap-2">
        <>
          {!isHomePage ? (
            <NewProductForm />
          ) : (
            <NewCategoryDrawer />
          )}
        </>
      </div>
    </footer>
  );
}
