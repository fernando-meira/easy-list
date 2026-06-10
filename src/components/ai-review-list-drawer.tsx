'use client';

import { toast } from 'sonner';
import { X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { AiGeneratedList } from '@/types/interfaces';
import { LoadingSpinner } from '@/components/loading-spinner';

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
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
            'max-h-[85vh]',
            'sm:mx-auto sm:max-w-[460px] sm:rounded-2xl sm:mb-6'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex flex-shrink-0 items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  {result?.categoryName}
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  {products.length} {products.length === 1 ? 'item' : 'itens'} gerados
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => onOpenChange?.(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 h-[68px] border border-[var(--color-hairline)] rounded-[var(--radius-lg)] px-3 py-[10px] bg-[var(--color-canvas)]"
                >
                  <div className="flex flex-1 flex-col gap-[3px] min-w-0">
                    <span className="text-[15px] font-semibold truncate text-[var(--color-ink)]">
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

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex h-10 w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
            >
              {isSaving ? <LoadingSpinner size={16} /> : buttonLabel}
            </button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
