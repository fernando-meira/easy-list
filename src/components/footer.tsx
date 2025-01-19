'use client';

import { convertToCurrency } from '@/utils';
import { calculateTotalValue } from '@/utils';
import { useProducts } from '@/context/ProductContext';

export function Footer() {
  const { products, allProductsWithoutPrice, allProductsInCartWithoutPrice } = useProducts();

  return !!products && (!allProductsWithoutPrice || !allProductsInCartWithoutPrice) &&  (
    <footer className="position: fixed bottom-0 w-full m-auto border-t max-w-3xl bg-white dark:bg-background">
      <div className="p-4 flex justify-between gap-4 mx-auto">
        {!allProductsWithoutPrice && (
          <p className="font-semibold">Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}</p>
        )}

        {!allProductsInCartWithoutPrice && (
          <p className="font-semibold text-teal-400">Carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}</p>
        )}
      </div>
    </footer>
  );
}
