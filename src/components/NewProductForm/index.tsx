'use client';

import React from 'react';

import { ProductManagerSheet } from '@/components';
import { AddOrEditProductTypeEnum } from '@/types/enums';

export function NewProductForm() {
  return <ProductManagerSheet type={AddOrEditProductTypeEnum.add} />;
}
