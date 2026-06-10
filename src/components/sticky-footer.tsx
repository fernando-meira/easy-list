'use client';

import { Plus } from 'lucide-react';

import { ProductProps } from '@/types/interfaces';
import { convertToCurrency, calculateTotalValue } from '@/utils';

interface StickyFooterProps {
  products: ProductProps[];
  onAddProduct: () => void;
}

export function StickyFooter({ products, onAddProduct }: StickyFooterProps) {
  const { totalProductsValue, filteredProductsValue } =
    calculateTotalValue(products);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 p-3 max-w-3xl mx-auto">
      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-3">
        {/* Totals row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold text-[var(--color-muted)]">
              Total
            </span>
            <span className="text-[12px] font-medium text-[var(--color-muted)]">
              Carrinho: {convertToCurrency(filteredProductsValue)}
            </span>
          </div>
          <span className="text-[22px] font-semibold text-[var(--color-ink)]">
            {convertToCurrency(totalProductsValue)}
          </span>
        </div>

        {/* Add product button */}
        <button
          onClick={(e) => {
            (e.currentTarget as HTMLButtonElement).blur();
            onAddProduct();
          }}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-[var(--radius-md)] bg-[var(--color-primary)]"
        >
          <Plus className="w-[18px] h-[18px] text-[var(--color-on-primary)]" />
          <span className="text-[14px] font-semibold text-[var(--color-on-primary)]">
            Adicionar produto
          </span>
        </button>
      </div>
    </div>
  );
}
