import { UnitEnum } from '@/types/enums';

export interface CategoryProps {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  subcategoryOrder?: string[];
  products?: Array<ProductProps>;
}

export interface ProductProps {
  _id?: string;
  name: string;
  unit?: string;
  price?: string;
  barcode?: string;
  createdAt: string;
  quantity?: string;
  updatedAt: string;
  addToCart?: boolean;
  categoryId?: string;
  subcategory?: string;
  category?: CategoryProps;
}

export interface AiGeneratedList {
  categoryName: string;
  products: {
    name: string;
    unit?: UnitEnum;
    quantity?: string;
  }[];
}
