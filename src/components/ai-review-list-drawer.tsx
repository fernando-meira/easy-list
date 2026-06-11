'use client';

import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useCategories } from '@/context';
import { AiGeneratedList } from '@/types/interfaces';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

interface AiReviewListDrawerProps {
  open?: boolean;
  result: AiGeneratedList | null;
  onOpenChange?: (open: boolean) => void;
}

export function AiReviewListDrawer({ open, result, onOpenChange }: AiReviewListDrawerProps) {
  const router = useRouter();
  const { markLocalMutation } = useCategories();
  const [products, setProducts] = useState<{ name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProducts(result?.products ?? []);
  }, [result]);

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!result || isSaving) return;

    setIsSaving(true);
    markLocalMutation(1 + products.length);

    try {
      const categoryResponse = await fetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: result.categoryName }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!categoryResponse.ok) throw new Error('Failed to create category');

      const { data: category } = await categoryResponse.json();

      for (const product of products) {
        const productResponse = await fetch('/api/products', {
          method: 'POST',
          body: JSON.stringify({ name: product.name, categoryId: category._id }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!productResponse.ok) throw new Error('Failed to create product');
      }

      onOpenChange?.(false);
      router.push(`/category?id=${category._id}`);
    } catch {
      markLocalMutation(-(1 + products.length));
      toast.error('Não foi possível criar a lista. Tente novamente.');
      setIsSaving(false);
    }
  };

  const buttonLabel =
    products.length === 0 ? 'Criar categoria vazia' : `Criar lista (${products.length} itens)`;

  return (
    <ResponsiveProductDialog
      open={open}
      title={result?.categoryName ?? 'Lista gerada'}
      description={`${products.length} ${products.length === 1 ? 'item gerado' : 'itens gerados'}`}
      onOpenChange={onOpenChange}
      footer={(
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex h-10 w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
        >
          {isSaving ? <LoadingSpinner size={16} /> : buttonLabel}
        </button>
      )}
    >
      <div className="flex flex-col gap-2 overflow-y-auto">
        {products.map((product, index) => (
          <div
            key={index}
            className="flex h-[68px] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3 py-[10px]"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[15px] font-semibold text-[var(--color-ink)]">
                {product.name}
              </span>
            </div>

            <div className="flex h-[34px] flex-shrink-0 items-center">
              <button
                type="button"
                aria-label={`Remover ${product.name}`}
                onClick={() => removeProduct(index)}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--color-surface-card)]"
              >
                <Trash2 className="h-[15px] w-[15px] text-[var(--color-error)]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ResponsiveProductDialog>
  );
}
