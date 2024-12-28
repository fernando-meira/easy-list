import { PrettyUnitEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';

export const products: ProductProps[] = (
  [
    {
      id: 1,
      quantity: '1',
      price: '10,00',
      addToCart: true,
      name: 'Laranja',
      unit: PrettyUnitEnum.unit,
    },
    {
      id: 2,
      quantity: '2',
      name: 'Banana',
      price: '20,00',
      addToCart: false,
      unit: PrettyUnitEnum.kg,
    }
  ]);
