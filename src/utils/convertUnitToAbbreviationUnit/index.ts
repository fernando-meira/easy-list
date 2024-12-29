import { AbbreviationUnitEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';

export const convertUnitToAbbreviationUnit = (product: ProductProps): ProductProps => {
  if (!product.unit) return product;

  const abbreviationUnit = AbbreviationUnitEnum[product.unit as keyof typeof AbbreviationUnitEnum];
  return {
    ...product,
    unit: abbreviationUnit ?? product.unit
  };
};
