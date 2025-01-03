'use client';

import React from 'react';

import { useCategories } from '@/context';
import { Button } from '@/components/ui/button';
import { ProductManagerSheet } from '@/components';
import { AddOrEditProductTypeEnum } from '@/types/enums';

export function NewProductForm() {
  const { addCategory } = useCategories();

  const [openNewProductSheet, setOpenNewProductSheet] = React.useState<boolean>(false);

  return (
    <>
      <ProductManagerSheet
        open={openNewProductSheet}
        type={AddOrEditProductTypeEnum.add}
        onOpenChange={setOpenNewProductSheet}
      />

      <Button
        className="w-full"
        onClick={() => addCategory({ name: 'Nova categoria' })}
      >
        Criar categoria
      </Button>
    </>
  );
}
