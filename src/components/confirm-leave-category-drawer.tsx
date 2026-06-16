'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

interface ConfirmLeaveCategoryDrawerProps {
  open: boolean;
  category?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmLeaveCategoryDrawer({
  open,
  category,
  onOpenChange,
}: ConfirmLeaveCategoryDrawerProps) {
  const { leaveSharedCategory } = useCategories();

  const [isLeaving, setIsLeaving] = React.useState(false);

  const handleLeave = async () => {
    if (isLeaving || !category) return;
    setIsLeaving(true);
    await leaveSharedCategory(category._id);
    setIsLeaving(false);
    onOpenChange(false);
  };

  if (!category) return null;

  return (
    <ResponsiveProductDialog
      open={open}
      title="Sair da lista"
      description={`Você vai sair de "${category.name}". Você não perderá os itens adicionados, mas deixará de ter acesso a ela.`}
      onOpenChange={onOpenChange}
      footer={(
        <button
          type="button"
          disabled={isLeaving}
          aria-describedby="leave-warning"
          onClick={handleLeave}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-error)] text-sm font-semibold text-white disabled:opacity-60"
        >
          <Trash2 className="h-5 w-5" />
          {isLeaving ? 'Saindo…' : 'Sair da lista'}
        </button>
      )}
    >
      <div className="rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
        <p id="leave-warning" className="text-sm font-medium text-foreground">
          Esta ação não pode ser desfeita.
        </p>
      </div>
    </ResponsiveProductDialog>
  );
}
