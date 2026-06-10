'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { PagesEnum } from '@/types/enums';
import { convertToCurrency } from '@/utils';
import { calculateTotalValue } from '@/utils';
import { useProducts } from '@/context/ProductContext';

import { NewProductForm } from './new-product-form';
import { NewCategoryDrawer } from './new-category-drawer';

export function Footer() {
  const pathname = usePathname();
  const { products, allProductsWithoutPrice, allProductsInCartWithoutPrice } = useProducts();
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);

  const isHomePage = pathname === PagesEnum.home;
  const shouldRenderPrice = !!products && !isHomePage && (!allProductsWithoutPrice || !allProductsInCartWithoutPrice);

  return (
    <footer className={'fixed bottom-0 w-full m-auto rounded-t-sm max-w-3xl bg-white dark:bg-background'}>
      {shouldRenderPrice && (
        <div className="p-4 flex justify-between gap-4 mx-auto">
          {!allProductsWithoutPrice && (
            <p className="font-semibold">Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}</p>
          )}

          {!allProductsInCartWithoutPrice && (
            <p className="font-semibold text-teal-400">Carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}</p>
          )}
        </div>
      )}

      <div className={isHomePage ? 'w-full p-4' : 'flex items-center gap-2'}>
        {!isHomePage ? (
          <NewProductForm />
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLButtonElement).blur();
                setCategoryDrawerOpen(true);
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
            >
              <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
              <span className="text-sm font-semibold text-[var(--color-on-primary)]">
                Adicionar categoria
              </span>
            </button>

            <NewCategoryDrawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen} />
          </>
        )}
      </div>
    </footer>
  );
}
