'use client';

import { Plus, ScanLine } from 'lucide-react';

import { ProductProps } from '@/types/interfaces';
import { convertToCurrency, calculateTotalValue } from '@/utils';

interface StickyFooterProps {
  products: ProductProps[];
  onAddProduct: () => void;
  onScanProduct: () => void;
}

export function StickyFooter({ products, onAddProduct, onScanProduct }: StickyFooterProps) {
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

        <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
          <button
            type="button"
            aria-label="Escanear produto"
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onScanProduct();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)]"
          >
            <ScanLine className="h-[18px] w-[18px]" />
            <span className="text-[14px] font-semibold">
              Escanear
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onAddProduct();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)]"
          >
            <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
            <span className="text-[14px] font-semibold text-[var(--color-on-primary)]">
              Adicionar produto
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
