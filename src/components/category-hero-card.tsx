'use client';

import { useRouter } from 'next/navigation';

import { ProductProps, CategoryProps } from '@/types/interfaces';

import { CategorySelect } from './category-select';

interface StatPillProps {
  value: number;
  label: string;
}

function StatPill({ value, label }: StatPillProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--color-surface-card)] px-2 py-1.5 w-full">
      <span className="text-[13px] font-semibold text-[var(--color-ink)]">{value}</span>
      <span className="text-[12px] font-medium text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

interface CategoryHeroCardProps {
  category: CategoryProps;
  products: ProductProps[];
}

export function CategoryHeroCard({ category, products }: CategoryHeroCardProps) {
  const router = useRouter();

  const pendingCount = products.filter(p => !p.addToCart).length;
  const cartCount = products.filter(p => p.addToCart).length;
  const totalCount = products.length;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => router.push('/')}
          className="text-[12px] font-semibold text-[var(--color-ink)]"
        >
          Home
        </button>
        <span className="text-[12px] text-[var(--color-muted)]">/</span>
        <span className="text-[12px] font-semibold text-[var(--color-muted)]">
          {category.name}
        </span>
      </div>

      {/* Hero title — Inter 600 with negative tracking (Cal Sans substitute) */}
      <h1
        className="text-[28px] font-semibold text-[var(--color-ink)]"
        style={{ letterSpacing: '-0.5px' }}
      >
        {category.name}
      </h1>

      {/* Subtitle */}
      <p className="text-[13px] font-medium text-[var(--color-muted)]">
        {totalCount} produto{totalCount !== 1 ? 's' : ''} nesta lista
      </p>

      {/* Stat pills */}
      <div className="flex flex-col gap-2 w-full">
        <StatPill value={pendingCount} label="pendentes" />
        <StatPill value={cartCount} label="no carrinho" />
      </div>

      {/* Category selector */}
      <CategorySelect />
    </div>
  );
}
