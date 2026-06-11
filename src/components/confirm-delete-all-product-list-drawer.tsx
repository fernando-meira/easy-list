'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useProducts } from '@/context/ProductContext';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

export function ConfirmDeleteAllProductListDrawer() {
  const { removeAllProducts, hasAnyProduct } = useProducts();
  const [open, setOpen] = React.useState(false);

  const handleRemoveAllProducts = () => {
    removeAllProducts();
    setOpen(false);
  };

  return hasAnyProduct && (
    <>
      <Button variant="destructive" className="mt-4" onClick={() => setOpen(true)}>
        Limpar listas
      </Button>

      <ResponsiveProductDialog
        open={open}
        title="Limpar lista"
        description="Tem certeza que deseja limpar a lista de produtos?"
        onOpenChange={setOpen}
        footer={(
          <Button variant="destructive" className="w-full" onClick={handleRemoveAllProducts}>
            Limpar lista
          </Button>
        )}
      >
        <p className="text-sm font-medium text-foreground">
          Esta ação não pode ser desfeita.
        </p>
      </ResponsiveProductDialog>
    </>
  );
}
