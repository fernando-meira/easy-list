import { convertToCurrency } from '@/utils';
import { UnitEnum } from '@/types/enums';

interface CalculateProductValueProps {
  price: string;
  unit?: UnitEnum;
  quantity: string;
}

const isValidValue = (value: string): boolean => {
  return !!value && value !== '0' && value !== 'null';
};

const formatPriceAndQuantity = (price: string, quantity: string): { numericPrice: number; numericQuantity: number } | null => {
  const numericPrice = parseFloat(price.replace(',', '.'));
  const numericQuantity = parseFloat(quantity.replace(',', '.'));

  if (isNaN(numericPrice) || isNaN(numericQuantity)) return null;

  return { numericPrice, numericQuantity };
};

export const calculateProductValue = ({
  unit,
  price,
  quantity,
}: CalculateProductValueProps): string => {
  // Caso 1: Apenas preço válido
  if (isValidValue(price) && !isValidValue(quantity)) {
    return convertToCurrency(price);
  }

  // Caso 2: Sem quantidade válida
  if (!isValidValue(quantity)) {
    return 'Sem informações';
  }

  // Caso 3: Apenas quantidade válida
  if (!isValidValue(price)) {
    return `${quantity} ${unit}`;
  }

  // Caso 4: Preço e quantidade válidos
  const values = formatPriceAndQuantity(price, quantity);
  if (!values) return '';

  const { numericPrice, numericQuantity } = values;

  if (unit === UnitEnum.grams) {
    const quantityInKg = numericQuantity / 1000;
    return `${quantity} ${unit} - ${convertToCurrency(String(numericPrice * quantityInKg))}`;
  }

  return `${quantity} ${unit} - ${convertToCurrency(String(numericPrice * numericQuantity))}`;
};
