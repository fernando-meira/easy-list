import { UnitEnum } from "./enums";

export interface Product {
  id: number;
  name: string;
  price?: string;
  unit?: UnitEnum;
  quantity?: string;
  addToCart: boolean;
}
