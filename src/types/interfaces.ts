export interface CategoryProps {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  products?: Array<ProductProps>;
  isShared?: boolean;
}

export interface ProductProps {
  name: string;
  _id?: string;
  unit?: string;
  price?: string;
  barcode?: string;
  createdAt: string;
  quantity?: string;
  updatedAt: string;
  addToCart?: boolean;
  categoryId?: string;
  category?: CategoryProps;
}
