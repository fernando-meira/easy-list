import { UnitEnum } from './enums';

export interface ProductProps {
  id: number;
  name: string;
  price?: string;
  unit?: UnitEnum;
  quantity?: string;
  addToCart: boolean;
}
