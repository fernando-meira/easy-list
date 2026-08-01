'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { ListX, Share2, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ProductProps, CategoryProps } from '@/types/interfaces';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CategoryHeroCardProps {
  isOrganizing?: boolean;
  category: CategoryProps;
  products: ProductProps[];
  isRemovingGrouping?: boolean;
  onOrganize?: () => Promise<void>;
  onRemoveGrouping?: () => Promise<void>;
}

export function CategoryHeroCard({
  isOrganizing,
  category,
  products,
  isRemovingGrouping,
  onOrganize,
  onRemoveGrouping,
}: CategoryHeroCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  async function handleShare() {
    try {
      const response = await fetch(`/api/categories/${category._id}/share`);
      if (!response.ok) { toast.error('Não foi possível gerar o link'); return; }
      const { shareUrl } = await response.json();
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado!');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }
  const cartCount = products.filter(p => p.addToCart).length;
  const totalCount = products.length;
  const cartPercent = totalCount > 0 ? Math.round((cartCount / totalCount) * 100) : 0;
  const toggleLabel = isOpen ? 'Recolher detalhes da categoria' : 'Expandir detalhes da categoria';

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-3.5 rounded-[var(--radius-xl)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-[18px] [font-family:var(--font-body)]"
    >
      <div className={`relative flex flex-col gap-2.5 ${!category.isShared ? 'pr-10' : ''}`}>
        <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-[var(--color-ink)] [font-family:var(--font-display)] [overflow-wrap:anywhere]">
          {category.name}
        </h1>

        {totalCount > 0 && (
          <div className="flex flex-col gap-1.5">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-card)]"
              role="progressbar"
              aria-valuenow={cartCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={`${cartCount} de ${totalCount} ${totalCount === 1 ? 'item' : 'itens'} no carrinho`}
            >
              <div
                className="h-full rounded-full bg-[var(--color-success)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${cartPercent}%` }}
              />
            </div>

            <span className="text-[12px] text-[var(--color-muted)]">
              <span className="font-semibold text-[var(--color-ink)]">
                {cartCount} de {totalCount}
              </span>{' '}
              {totalCount === 1 ? 'item' : 'itens'} no carrinho
            </span>
          </div>
        )}

        {!category.isShared && (
          <CollapsibleTrigger
            className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] text-[var(--color-ink)] transition-colors before:absolute before:-inset-1 before:rounded-full before:content-[''] hover:bg-[var(--color-surface-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
            aria-label={toggleLabel}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </CollapsibleTrigger>
        )}
      </div>

      {!category.isShared && (
        <CollapsibleContent className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={onOrganize}
              disabled={isOrganizing || products.length < 2}
              className="h-10 w-full sm:flex-1 border-[var(--color-hairline)] bg-[var(--color-surface-card)] text-sm font-semibold text-[var(--color-ink)] shadow-none hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] disabled:opacity-50 [&_svg]:size-4"
            >
              {isOrganizing ? <LoadingSpinner size={14} /> : <Sparkles aria-hidden="true" />}
              Organizar lista
            </Button>

            {(category.subcategoryOrder?.length ?? 0) > 0 && (
              <Button
                variant="outline"
                onClick={onRemoveGrouping}
                disabled={isRemovingGrouping}
                className="h-10 w-full sm:flex-1 border-[var(--color-hairline)] bg-[var(--color-surface-card)] text-sm font-semibold text-[var(--color-ink)] shadow-none hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] disabled:opacity-50 [&_svg]:size-4"
              >
                {isRemovingGrouping ? <LoadingSpinner size={14} /> : <ListX aria-hidden="true" />}
                Remover agrupamento
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleShare}
            className="h-10 w-full border-[var(--color-hairline)] bg-[var(--color-surface-card)] text-sm font-semibold text-[var(--color-ink)] shadow-none hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] [&_svg]:size-4"
          >
            <Share2 aria-hidden="true" />
            Compartilhar lista
          </Button>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
