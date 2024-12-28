import { convertToCurrency } from '@/utils';
import { AbbreviationUnitEnum, PrettyUnitEnum, UnitEnum } from '@/types/enums';

interface CalculateProductValueProps {
  price: string;
  quantity: string;
  unit?: UnitEnum | PrettyUnitEnum | AbbreviationUnitEnum;
}

export const calculateProductValue = ({ quantity, price, unit }: CalculateProductValueProps): string => {
  if (!price || !quantity) return '0';

  const numericPrice = parseFloat(price);
  const numericQuantity = parseFloat(quantity);

  if (unit === UnitEnum.grams || unit === PrettyUnitEnum.grams || unit === AbbreviationUnitEnum.grams) {
    const quantityInKg = numericQuantity / 1000;

    return convertToCurrency(String(numericPrice * quantityInKg));
  }

  return convertToCurrency(String(numericPrice * numericQuantity));
};
