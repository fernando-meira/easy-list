'use client';

import React from 'react';

import { AddOrEditProductTypeEnum } from '@/types/enums';

import { ProductManagerSheet } from './product-manager-sheet';

export function NewProductForm() {
  const [openNewProductSheet, setOpenNewProductSheet] = React.useState<boolean>(false);

  return (
    <>
      <ProductManagerSheet
        open={openNewProductSheet}
        type={AddOrEditProductTypeEnum.add}
        onOpenChange={setOpenNewProductSheet}
      />
    </>
  );
}
