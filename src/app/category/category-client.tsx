'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { useCategories, useProducts } from '@/context';
import { ProductProps } from '@/types/interfaces';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { Skeleton } from '@/components/ui/skeleton';

import { StateCard } from '@/components/state-card';
import { GroupHeader } from '@/components/group-header';
import { ProductRow } from '@/components/product-row';
import { StickyFooter } from '@/components/sticky-footer';
import { CategoryHeroCard } from '@/components/category-hero-card';
import { ProductManagerSheet } from '@/components/product-manager-sheet';

export function CategoryClient() {
  const searchParams = useSearchParams();
  const { setSelectedCategoryId, filteredCategory, isLoadingCategories } = useCategories();
  const { removeProduct, toggleCart, isProductLoading } = useProducts();

  const categoryId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps>({} as ProductProps);

  useEffect(() => {
    if (!categoryId) return;
    setSelectedCategoryId(categoryId);
    setIsLoading(false);
  }, [categoryId, setSelectedCategoryId]);

  const handleEditProduct = (product: ProductProps) => {
    setSelectedProduct(product);
    setEditSheetOpen(true);
  };

  const { productsNotInCart, productsInCart } = useMemo(() => {
    const all = filteredCategory?.products ?? [];
    const sorted = [...all].sort((a, b) =>
      (a.name ?? '').toLowerCase().localeCompare(
        (b.name ?? '').toLowerCase(),
        'pt-BR'
      )
    );
    return {
      productsNotInCart: sorted.filter(p => !p.addToCart),
      productsInCart: sorted.filter(p => p.addToCart),
    };
  }, [filteredCategory?.products]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-[140px]">
        <Skeleton className="h-[220px] w-full rounded-[var(--radius-xl)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  // Error state — invalid category ID
  if (!filteredCategory && !isLoadingCategories) {
    return <StateCard variant="error" />;
  }

  if (!filteredCategory) return null;

  const allProducts = filteredCategory.products ?? [];

  return (
    <>
      <div className="flex flex-col gap-4 pb-[140px]">
        <CategoryHeroCard
          category={filteredCategory}
          products={allProducts}
        />

        {allProducts.length === 0 && (
          <StateCard variant="empty" onAdd={() => setAddSheetOpen(true)} />
        )}

        {productsNotInCart.length > 0 && (
          <>
            <GroupHeader
              title="Fora do carrinho"
              count={productsNotInCart.length}
            />
            {productsNotInCart.map(p => (
              <ProductRow
                key={p._id}
                product={p}
                variant="pending"
                openSwipeId={openSwipeId}
                onSwipeOpen={setOpenSwipeId}
                onToggleCart={toggleCart}
                onEdit={handleEditProduct}
                onDelete={removeProduct}
                isProductLoading={isProductLoading}
              />
            ))}
          </>
        )}

        {productsInCart.length > 0 && (
          <>
            <GroupHeader
              title="Carrinho"
              count={productsInCart.length}
            />
            {productsInCart.map(p => (
              <ProductRow
                key={p._id}
                product={p}
                variant="cart"
                openSwipeId={openSwipeId}
                onSwipeOpen={setOpenSwipeId}
                onToggleCart={toggleCart}
                onEdit={handleEditProduct}
                onDelete={removeProduct}
                isProductLoading={isProductLoading}
              />
            ))}
          </>
        )}
      </div>

      <StickyFooter
        products={allProducts}
        onAddProduct={() => setAddSheetOpen(true)}
      />

      <ProductManagerSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        type={AddOrEditProductTypeEnum.add}
      />

      <ProductManagerSheet
        open={editSheetOpen}
        product={selectedProduct}
        onOpenChange={setEditSheetOpen}
        type={AddOrEditProductTypeEnum.edit}
      />
    </>
  );
}
