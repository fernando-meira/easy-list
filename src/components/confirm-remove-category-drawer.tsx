'use client';

import React from 'react';
import { Trash } from 'lucide-react';

import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

interface ConfirmRemoveCategoryDrawerProps {
  open: boolean;
  category?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmRemoveCategoryDrawer({ category, open, onOpenChange }: ConfirmRemoveCategoryDrawerProps) {
  const { removeCategory } = useCategories();

  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemoveCategory = async () => {
    if (isRemoving || !category) return;
    setIsRemoving(true);
    await removeCategory(category._id);
    setIsRemoving(false);
    onOpenChange(false);
  };

  if (!category) return null;

  return (
    <ResponsiveProductDialog
      open={open}
      title={category.name}
      description="Tem certeza que deseja remover esta categoria?"
      onOpenChange={onOpenChange}
      footer={(
        <button
          type="button"
          disabled={isRemoving}
          aria-describedby="remove-warning"
          onClick={handleRemoveCategory}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-error)] text-sm font-semibold text-white disabled:opacity-60"
        >
          <Trash className="h-5 w-5" />
          {isRemoving ? 'Removendo…' : `Remover ${category.name}`}
        </button>
      )}
    >
      <div className="rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
        <p id="remove-warning" className="text-sm font-medium text-foreground">
          Esta ação não pode ser desfeita.
        </p>
      </div>
    </ResponsiveProductDialog>
  );
}
