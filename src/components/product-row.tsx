'use client';

import { useRef, useState, useEffect } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { useDrag } from '@use-gesture/react';

import { UnitEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateProductValue } from '@/utils';

const DELETE_ZONE_WIDTH = 72;
const SNAP_THRESHOLD = 56;

interface ProductRowProps {
  product: ProductProps;
  variant: 'pending' | 'cart';
  openSwipeId: string | null;
  onSwipeOpen: (id: string | null) => void;
  onToggleCart: (id: string) => void;
  onEdit: (product: ProductProps) => void;
  onDelete: (id: string) => void;
  isProductLoading: { productId: string | null; isLoading: boolean };
}

export function ProductRow({
  product,
  variant,
  openSwipeId,
  onSwipeOpen,
  onToggleCart,
  onEdit,
  onDelete,
  isProductLoading,
}: ProductRowProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startOffsetRef = useRef(0);

  const isPending = variant === 'pending';
  const isThisLoading =
    isProductLoading.isLoading && isProductLoading.productId === product._id;

  // Close this row when another row opens
  useEffect(() => {
    if (openSwipeId !== product._id) {
      setOffset(0);
    }
  }, [openSwipeId, product._id]);

  const bind = useDrag(
    ({ movement: [mx], last, active, first }) => {
      if (first) {
        startOffsetRef.current = offset;
      }

      setIsDragging(active);
      const newOffset = Math.max(
        -DELETE_ZONE_WIDTH,
        Math.min(0, startOffsetRef.current + mx)
      );
      setOffset(newOffset);

      if (last) {
        setIsDragging(false);
        if (newOffset <= -SNAP_THRESHOLD) {
          setOffset(-DELETE_ZONE_WIDTH);
          onSwipeOpen(product._id!);
        } else {
          setOffset(0);
          if (openSwipeId === product._id) onSwipeOpen(null);
        }
      }
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } }
  );

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
      className="relative overflow-hidden rounded-[var(--radius-lg)]"
      style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 200ms ease' }}
    >
      {/* Delete zone — revealed as row content slides left */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 rounded-r-[var(--radius-lg)]"
        style={{ width: DELETE_ZONE_WIDTH }}
      >
        <button
          onClick={handleDelete}
          disabled={isThisLoading || isDeleting}
          className="flex items-center justify-center w-full h-full"
          aria-label="Excluir produto"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Row content — slides left on drag */}
      <div
        {...bind()}
        className={[
          'relative flex items-center gap-3 h-[68px]',
          'border border-[var(--color-hairline)] rounded-[var(--radius-lg)]',
          'px-3 py-[10px] select-none',
          isPending
            ? 'bg-[var(--color-canvas)]'
            : 'bg-[var(--color-surface-card)]',
        ].join(' ')}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 200ms ease',
          touchAction: 'pan-y',
        }}
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

        {/* Edit button */}
        <button
          onClick={() => onEdit(product)}
          className="w-[34px] h-[34px] rounded-full bg-[var(--color-surface-card)] flex items-center justify-center flex-shrink-0"
          aria-label="Editar produto"
        >
          <Pencil className="w-[15px] h-[15px] text-[var(--color-ink)]" />
        </button>
      </div>
    </div>
  );
}
