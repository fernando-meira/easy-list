'use client';

import React from 'react';

import { AddOrEditProductTypeEnum } from '@/types/enums';

import { ProductManagerDrawer } from './product-manager-drawer';

export function NewProductForm() {
  const [openNewProductSheet, setOpenNewProductSheet] = React.useState<boolean>(false);

  return (
    <>
      <ProductManagerDrawer
        open={openNewProductSheet}
        type={AddOrEditProductTypeEnum.add}
        onOpenChange={setOpenNewProductSheet}
      />
    </>
  );
}
