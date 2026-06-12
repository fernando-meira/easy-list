'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { Share2, Sparkles, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ProductProps, CategoryProps } from '@/types/interfaces';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { CategorySelect } from './category-select';

interface StatPillProps {
  value: number;
  label: string;
}

function StatPill({ value, label }: StatPillProps) {
  return (
    <div className="flex flex-1 items-center gap-1.5 rounded-full bg-[var(--color-surface-soft)] px-3 py-[9px]">
      <span className="text-[13px] font-medium text-[var(--color-ink)]">{value}</span>
      <span className="text-[13px] font-medium text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

interface CategoryHeroCardProps {
  isOrganizing?: boolean;
  category: CategoryProps;
  products: ProductProps[];
  onOrganize?: () => Promise<void>;
}

export function CategoryHeroCard({ isOrganizing, category, products, onOrganize }: CategoryHeroCardProps) {
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
  const pendingCount = products.filter(p => !p.addToCart).length;
  const cartCount = products.filter(p => p.addToCart).length;
  const totalCount = products.length;
  const toggleLabel = isOpen ? 'Recolher detalhes da categoria' : 'Expandir detalhes da categoria';

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-3.5 rounded-[var(--radius-xl)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-[18px] [font-family:var(--font-body)]"
    >
      <div className="relative flex flex-col gap-2.5 pr-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-[var(--color-ink)] [font-family:var(--font-display)]">
            {category.name}
          </h1>

          <p className="text-[13px] font-medium text-[var(--color-muted)]">
            {totalCount} produto{totalCount !== 1 ? 's' : ''} nesta lista
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface-soft)] px-2.5 py-2">
          <ShoppingCart className="h-3.5 w-3.5 text-[var(--color-success)]" />
          <span className="text-[13px] font-medium text-[var(--color-ink)]">
            {cartCount} no carrinho
          </span>
        </div>

        <CollapsibleTrigger
          className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
          aria-label={toggleLabel}
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="flex flex-col gap-3.5">
        <div className="flex w-full gap-2.5">
          <StatPill value={pendingCount} label="pendentes" />
          <StatPill value={cartCount} label="comprados" />
        </div>

        {!category.isShared && (
          <>
            <Button
              variant="outline"
              onClick={handleShare}
              className="h-10 w-full border-[var(--color-hairline)] bg-[var(--color-surface-card)] text-sm font-semibold text-[var(--color-ink)] shadow-none hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] [&_svg]:size-4"
            >
              <Share2 aria-hidden="true" />
              Compartilhar lista
            </Button>

            <Button
              variant="outline"
              onClick={onOrganize}
              disabled={isOrganizing || products.length < 2}
              className="h-10 w-full border-[var(--color-hairline)] bg-[var(--color-surface-card)] text-sm font-semibold text-[var(--color-ink)] shadow-none hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] disabled:opacity-50 [&_svg]:size-4"
            >
              {isOrganizing ? (
                <>
                  <LoadingSpinner size={16} />
                  Organizando...
                </>
              ) : (
                <>
                  <Sparkles aria-hidden="true" />
                  Organizar lista
                </>
              )}
            </Button>
          </>
        )}

        <div>
          <CategorySelect />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
