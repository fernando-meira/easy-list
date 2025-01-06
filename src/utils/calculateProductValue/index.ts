import { convertToCurrency } from '@/utils';
import { UnitEnum } from '@/types/enums';

interface CalculateProductValueProps {
  price: string;
  unit?: UnitEnum;
  quantity: string;
}

export const calculateProductValue = ({ quantity, price, unit }: CalculateProductValueProps): string => {
  if (!price || !quantity || !unit) return '';

  const numericPrice = parseFloat(price.replace(',', '.'));
  const numericQuantity = parseFloat(quantity.replace(',', '.'));

  if (isNaN(numericPrice) || isNaN(numericQuantity)) return '';

  if (unit === UnitEnum.grams) {
    const quantityInKg = numericQuantity / 1000;

    return ` - ${convertToCurrency(String(numericPrice * quantityInKg))}`;
  }

  return ` - ${convertToCurrency(String(numericPrice * numericQuantity))}`;
};
