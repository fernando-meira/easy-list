'use client';

import { useState, useEffect } from 'react';
import { Plus, ScanLine } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ProductProps } from '@/types/interfaces';
import { FOOTER_CLEARANCE_PX } from '@/lib/constants';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { convertToCurrency, calculateTotalValue } from '@/utils';

interface StickyFooterProps {
  products: ProductProps[];
  onAddProduct: () => void;
  onScanProduct: () => void;
}

export function StickyFooter({ products, onAddProduct, onScanProduct }: StickyFooterProps) {
  const { isNearBottom, isScrollingDown } = useScrollDirection({
    bottomOffset: FOOTER_CLEARANCE_PX,
  });

  const [forceExpanded, setForceExpanded] = useState(false);

  const { totalProductsValue, filteredProductsValue } =
    calculateTotalValue(products);

  useEffect(() => {
    if (isScrollingDown) setForceExpanded(false);
  }, [isScrollingDown]);

  const isCompact = isScrollingDown && !isNearBottom && !forceExpanded;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 pointer-events-none">
      <div className="relative mx-auto max-w-3xl p-3">
        <div
          inert={isCompact}
          aria-hidden={isCompact}
          className={cn(
            'flex flex-col gap-3 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-3 origin-bottom transition-all duration-200 ease-out motion-reduce:transition-none',
            isCompact
              ? 'pointer-events-none translate-y-2 scale-95 opacity-0'
              : 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          )}
        >
          {/* Totals row */}
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[12px] font-semibold text-[var(--color-muted)] truncate">
                Total
              </span>
              <span className="text-[12px] font-medium text-[var(--color-muted)] truncate">
                Carrinho: {convertToCurrency(filteredProductsValue)}
              </span>
            </div>
            <span className="text-[22px] font-semibold text-[var(--color-ink)] shrink-0">
              {convertToCurrency(totalProductsValue)}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_48px] gap-2">
            <button
              type="button"
              tabIndex={isCompact ? -1 : 0}
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

            <button
              type="button"
              aria-label="Escanear produto"
              tabIndex={isCompact ? -1 : 0}
              onClick={(e) => {
                (e.currentTarget as HTMLButtonElement).blur();
                onScanProduct();
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-card)]"
            >
              <ScanLine className="h-[15px] w-[15px] text-[var(--color-ink)]" />
            </button>
          </div>
        </div>

        <button
          type="button"
          inert={!isCompact}
          aria-hidden={!isCompact}
          tabIndex={isCompact ? 0 : -1}
          onClick={() => setForceExpanded(true)}
          aria-label="Expandir resumo do carrinho"
          className={cn(
            'absolute bottom-3 right-3 flex h-12 items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 shadow-lg origin-bottom-right transition-all duration-200 ease-out motion-reduce:transition-none',
            isCompact
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-2 scale-90 opacity-0'
          )}
        >
          <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
          <span className="text-[14px] font-semibold text-[var(--color-on-primary)]">
            {convertToCurrency(totalProductsValue)}
          </span>
        </button>
      </div>
    </div>
  );
}
