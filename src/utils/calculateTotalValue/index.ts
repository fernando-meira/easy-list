import { UnitEnum } from "@/types/enums";
import { Product } from "@/types/interfaces";

export const calculateTotalValue = (products: Product[]): { totalProductsValue: number, filteredProductsValue: number } => {
  const calculateValue = (items: Product[]) => {
    return items.reduce((total, product) => {
      if (product.price === undefined || product.quantity === undefined) return total;

      const price = parseFloat(product.price);
      const rawQuantity = parseFloat(product.quantity);

      if (product.unit === UnitEnum.grams) {
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
