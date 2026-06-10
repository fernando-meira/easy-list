'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';

import { UnitEnum } from '@/types/enums';
import { calculateProductValue } from '@/utils';
import { ProductProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductRowProps {
  product: ProductProps;
  variant: 'pending' | 'cart';
  onToggleCart: (id: string) => void;
  onEdit: (product: ProductProps) => void;
  onDelete: (id: string) => void;
  isProductLoading: { productId: string | null; isLoading: boolean };
}

export function ProductRow({
  product,
  variant,
  onToggleCart,
  onEdit,
  onDelete,
  isProductLoading,
}: ProductRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isPending = variant === 'pending';
  const isThisLoading =
    isProductLoading.isLoading && isProductLoading.productId === product._id;

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(product._id!);
  };

  const metadata = calculateProductValue({
    price: String(product.price ?? ''),
    unit: product.unit as UnitEnum,
    quantity: String(product.quantity ?? ''),
  });

  return (
    <div
      className={[
        'flex items-center gap-3 h-[68px]',
        'border border-[var(--color-hairline)] rounded-[var(--radius-lg)]',
        'px-3 py-[10px]',
        isPending
          ? 'bg-[var(--color-canvas)]'
          : 'bg-[var(--color-surface-card)]',
      ].join(' ')}
      style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 200ms ease' }}
    >
      {/* Checkbox / skeleton while loading */}
      {isThisLoading ? (
        <Skeleton className="w-[34px] h-[34px] rounded-full flex-shrink-0" />
      ) : (
        <button
          onClick={() => onToggleCart(product._id!)}
          className={[
            'w-[34px] h-[34px] rounded-full flex-shrink-0',
            'flex items-center justify-center border-2',
            isPending
              ? 'bg-[var(--color-canvas)] border-[var(--color-hairline)]'
              : 'bg-[var(--color-primary)] border-[var(--color-primary)]',
          ].join(' ')}
          aria-label={isPending ? 'Adicionar ao carrinho' : 'Remover do carrinho'}
        >
          {!isPending && (
            <Check className="w-[18px] h-[18px] text-[var(--color-on-primary)]" />
          )}
        </button>
      )}

      {/* Product name + metadata */}
      <div className="flex flex-col gap-[3px] flex-1 min-w-0">
        <span
          className={[
            'text-[15px] font-semibold truncate',
            isPending
              ? 'text-[var(--color-ink)]'
              : 'text-[var(--color-muted)]',
          ].join(' ')}
        >
          {product.name}
        </span>
        {metadata && (
          <span className="text-[12px] text-[var(--color-muted)] truncate">
            {metadata}
          </span>
        )}
      </div>

      <div className="flex h-[34px] items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => {
            (e.currentTarget as HTMLButtonElement).blur();
            onEdit(product);
          }}
          disabled={isThisLoading || isDeleting}
          className="w-[34px] h-[34px] rounded-full bg-[var(--color-surface-card)] flex items-center justify-center disabled:opacity-50"
          aria-label="Editar produto"
        >
          <Pencil className="w-[15px] h-[15px] text-[var(--color-ink)]" />
        </button>

        <button
          onClick={handleDelete}
          disabled={isThisLoading || isDeleting}
          className="w-[34px] h-[34px] rounded-full bg-[var(--color-surface-card)] flex items-center justify-center disabled:opacity-50"
          aria-label="Excluir produto"
        >
          <Trash2 className="w-[15px] h-[15px] text-[var(--color-error)]" />
        </button>
      </div>
    </div>
  );
}
