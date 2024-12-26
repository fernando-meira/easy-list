import { PrettyUnitEnum, UnitEnum } from "./enums";

export interface Product {
  id: number;
  name: string;
  price?: string;
  quantity?: string;
  addToCart: boolean;
  unit?: PrettyUnitEnum | UnitEnum;
}
