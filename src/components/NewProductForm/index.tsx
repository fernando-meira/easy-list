'use client';

import React from 'react';

import { AddOrEditProductTypeEnum } from '@/types/enums';
import { NewCategoryDrawer, ProductManagerSheet } from '@/components';

export function NewProductForm() {
  const [openNewProductSheet, setOpenNewProductSheet] = React.useState<boolean>(false);
  const [openNewCategoryDrawer, setOpenNewCategoryDrawer] = React.useState<boolean>(false);

  return (
    <>
      <ProductManagerSheet
        open={openNewProductSheet}
        type={AddOrEditProductTypeEnum.add}
        onOpenChange={setOpenNewProductSheet}
      />

      <NewCategoryDrawer open={openNewCategoryDrawer} onOpenChange={setOpenNewCategoryDrawer} />
    </>
  );
}
