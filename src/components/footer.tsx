'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { PagesEnum } from '@/types/enums';
import { AiGeneratedList } from '@/types/interfaces';
import { useProducts } from '@/context/ProductContext';
import { convertToCurrency, calculateTotalValue } from '@/utils';

import { NewProductForm } from './new-product-form';
import { NewCategoryDrawer } from './new-category-drawer';
import { AiReviewListDrawer } from './ai-review-list-drawer';
import { AiGenerateListDrawer } from './ai-generate-list-drawer';

export function Footer() {
  const pathname = usePathname();
  const { products, allProductsWithoutPrice, allProductsInCartWithoutPrice } = useProducts();

  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AiGeneratedList | null>(null);

  const isHomePage = pathname === PagesEnum.home;
  const shouldRenderPrice =
    !!products &&
    !isHomePage &&
    (!allProductsWithoutPrice || !allProductsInCartWithoutPrice);

  const handleGenerated = (result: AiGeneratedList) => {
    setAiResult(result);
    setAiReviewOpen(true);
  };

  return (
    <footer className="fixed bottom-0 w-full m-auto rounded-t-sm max-w-3xl bg-white dark:bg-background">
      {shouldRenderPrice && (
        <div className="p-4 flex justify-between gap-4 mx-auto">
          {!allProductsWithoutPrice && (
            <p className="font-semibold">
              Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}
            </p>
          )}

          {!allProductsInCartWithoutPrice && (
            <p className="font-semibold text-teal-400">
              Carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}
            </p>
          )}
        </div>
      )}

      <div className={isHomePage ? 'w-full p-4' : 'flex items-center gap-2'}>
        {!isHomePage ? (
          <NewProductForm />
        ) : (
          <>
            <div className="grid grid-cols-[1fr_48px] gap-2">
              <button
                type="button"
                onClick={(e) => {
                  (e.currentTarget as HTMLButtonElement).blur();
                  setCategoryDrawerOpen(true);
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
                <span className="text-sm font-semibold text-[var(--color-on-primary)]">
                  Adicionar categoria
                </span>
              </button>

              <button
                type="button"
                aria-label="Criar lista com IA"
                onClick={(e) => {
                  (e.currentTarget as HTMLButtonElement).blur();
                  setAiGenerateOpen(true);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-card)]"
              >
                <Sparkles className="h-[18px] w-[18px] text-[var(--color-ink)]" />
              </button>
            </div>

            <NewCategoryDrawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen} />

            <AiGenerateListDrawer
              open={aiGenerateOpen}
              onGenerated={handleGenerated}
              onOpenChange={setAiGenerateOpen}
            />

            <AiReviewListDrawer
              open={aiReviewOpen}
              result={aiResult}
              onOpenChange={setAiReviewOpen}
            />
          </>
        )}
      </div>
    </footer>
  );
}
