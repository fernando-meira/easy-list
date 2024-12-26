import { convertToCurrency } from "@/utils";
import { PrettyUnitEnum, UnitEnum } from "@/types/enums";

interface CalculateProductValueProps {
  price: string;
  quantity: string;
  unit?: UnitEnum | PrettyUnitEnum;
}

export const calculateProductValue = ({ quantity, price, unit }: CalculateProductValueProps): string => {
  if (!price || !quantity) return "0";

  const numericPrice = parseFloat(price);
  const numericQuantity = parseFloat(quantity);

  if (unit === UnitEnum.grams || unit === PrettyUnitEnum.grams) {
    const quantityInKg = numericQuantity / 1000;

    return convertToCurrency(String(numericPrice * quantityInKg));
  }

  return convertToCurrency(String(numericPrice * numericQuantity));
};
