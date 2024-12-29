'use client';

import Image from 'next/image';

import { useProducts } from '@/context/ProductContext';
import { ConfirmCleanProductListDrawer, NewProductForm } from '@/components';

export function Header() {
  const { products } = useProducts();

  return (
    <header className="flex items-center justify-between w-full p-4 space-x-4 border-b">
      <Image
        priority
        width={24}
        height={24}
        src="/logo.png"
        alt="Easy Shop Logo"
        className="dark:invert"
      />

      <div className="flex items-center gap-4">
        {!!products && products.length > 0 && (
          <ConfirmCleanProductListDrawer/>
        )}

        <NewProductForm/>
      </div>
    </header>
  );
}
