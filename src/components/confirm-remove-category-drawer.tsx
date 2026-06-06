'use client';

import { toast } from 'sonner';
import { X, Trash } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';

interface ConfirmRemoveCategoryDrawerProps {
  open: boolean;
  category?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmRemoveCategoryDrawer({ category, open, onOpenChange }: ConfirmRemoveCategoryDrawerProps) {
  const { removeCategory } = useCategories();

  const handleRemoveCategory = () => {
    if (!category) {
      toast('Categoria não encontrada');
      return;
    }

    removeCategory(category._id);
    onOpenChange(false);
  };

  if (!category) return null;

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  {category.name}
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  Tem certeza que deseja remover esta categoria?
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
              <p className="text-sm font-medium text-foreground">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemoveCategory}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-error)] text-sm font-semibold text-white"
            >
              <Trash className="h-5 w-5" />
              Remover {category.name}
            </button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
