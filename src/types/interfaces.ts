export interface CategoryProps {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    _id?: string;
    name: string;
    unit?: string;
    price?: string;
    quantity?: string;
    categoryId?: string;
    addToCart?: boolean;
  }>;
}

export interface ProductProps {
  _id?: string;
  name: string;
  unit?: string;
  price?: string;
  quantity?: string;
  categoryId?: string;
  addToCart?: boolean;
  category?: CategoryProps;
}
