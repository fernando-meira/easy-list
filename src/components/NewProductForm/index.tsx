'use client';

import React from 'react';

import { useWindowSize } from '@/hooks/useWindowSize';
import { AddProductModal, AddProductSheet } from '@/components';

export function NewProductForm() {
  const { isDesktop } = useWindowSize();

  return isDesktop ? (
    <AddProductModal />
  ) : (
    <AddProductSheet />
  );
}
