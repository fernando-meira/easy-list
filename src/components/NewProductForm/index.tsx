'use client';

import React from 'react';

import { ProductManagerSheet } from '@/components';
import { AddOrEditProductTypeEnum } from '@/types/enums';

export function NewProductForm() {
  const [openNewProductSheet, setOpenNewProductSheet] = React.useState<boolean>(false);

  return (
    <ProductManagerSheet
      open={openNewProductSheet}
      type={AddOrEditProductTypeEnum.add}
      onOpenChange={setOpenNewProductSheet}
    />
  );
}
