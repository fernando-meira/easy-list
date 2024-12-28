'use client';

import React from 'react';

import { useWindowSize } from '@/hooks/useWindowSize';
import { AddProductDrawer, AddProductModal } from '@/components';

export function NewProductForm() {
  const { isDesktop } = useWindowSize();

  return isDesktop ? (
    <AddProductModal />
  ) : (
    <AddProductDrawer />
  );
}
