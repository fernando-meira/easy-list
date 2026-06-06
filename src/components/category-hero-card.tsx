'use client';

import { ShoppingCart } from 'lucide-react';

import { ProductProps, CategoryProps } from '@/types/interfaces';

import { CategorySelect } from './category-select';

interface StatPillProps {
  value: number;
  label: string;
}

function StatPill({ value, label }: StatPillProps) {
  return (
    <div className="flex flex-1 items-center gap-1.5 rounded-full bg-[var(--color-surface-dark)] px-3 py-[9px]">
      <span className="text-[13px] font-medium text-[var(--color-on-dark)]">{value}</span>
      <span className="text-[13px] font-medium text-[var(--color-on-dark-soft)]">{label}</span>
    </div>
  );
}

interface CategoryHeroCardProps {
  category: CategoryProps;
  products: ProductProps[];
}

export function CategoryHeroCard({ category, products }: CategoryHeroCardProps) {
  const pendingCount = products.filter(p => !p.addToCart).length;
  const cartCount = products.filter(p => p.addToCart).length;
  const totalCount = products.length;

  return (
    <div className="flex flex-col gap-3.5 rounded-[var(--radius-xl)] border border-[var(--color-surface-dark-elevated)] bg-[var(--color-surface-dark-elevated)] p-[18px] [font-family:var(--font-body)]">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          {/* Hero title */}
          <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-[var(--color-on-dark)] [font-family:var(--font-display)]">
            {category.name}
          </h1>

          {/* Subtitle */}
          <p className="text-[13px] font-medium text-[var(--color-on-dark-soft)]">
            {totalCount} produto{totalCount !== 1 ? 's' : ''} nesta lista
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface-dark)] px-2.5 py-2">
          <ShoppingCart className="h-3.5 w-3.5 text-[var(--color-success)]" />
          <span className="text-[13px] font-medium text-[var(--color-on-dark)]">
            {cartCount} no carrinho
          </span>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex w-full gap-2.5">
        <StatPill value={pendingCount} label="pendentes" />
        <StatPill value={cartCount} label="comprados" />
      </div>

      {/* Category selector */}
      <CategorySelect />
    </div>
  );
}
