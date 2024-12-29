import { AbbreviationUnitEnum, PrettyUnitEnum, UnitEnum } from './enums';

export interface ProductProps {
  id: number;
  name: string;
  price?: string;
  quantity?: string;
  addToCart: boolean;
  unit?: PrettyUnitEnum | UnitEnum | AbbreviationUnitEnum;
}
