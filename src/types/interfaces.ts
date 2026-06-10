export interface CategoryProps {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  products?: Array<ProductProps>;
  isShared?: boolean;
}

export interface ProductProps {
  _id?: string;
  name: string;
  barcode?: string;
  unit?: string;
  price?: string;
  quantity?: string;
  categoryId?: string;
  addToCart?: boolean;
  updatedAt: string;
  createdAt: string;
  category?: CategoryProps;
}
