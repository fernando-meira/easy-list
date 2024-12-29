import { AbbreviationUnitEnum, PrettyUnitEnum, UnitEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';

export const calculateTotalValue = (products: ProductProps[]): { totalProductsValue: number, filteredProductsValue: number } => {
  const calculateValue = (items: ProductProps[]) => {
    const filteredProductsWithDefinedValues = items.filter((product) => product.price && product.quantity && product.unit);

    return filteredProductsWithDefinedValues.reduce((total, product) => {
      const price = product.price && parseFloat(product.price) || 0;
      const rawQuantity = product.quantity && parseFloat(product.quantity) || 0;

      if (!!product.unit && (product.unit === UnitEnum.grams || product.unit === AbbreviationUnitEnum.grams || product.unit === PrettyUnitEnum.grams)) {
        const quantityInKg = rawQuantity / 1000;
        return total + (price * quantityInKg);
      }

      return total + (price * rawQuantity);
    }, 0);
  };

  const filteredProducts = products.filter((product) => product.addToCart);

  return {
    totalProductsValue: calculateValue(products),
    filteredProductsValue: calculateValue(filteredProducts)
  };
};
