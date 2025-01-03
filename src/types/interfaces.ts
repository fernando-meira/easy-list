export interface CategoryProps {
  _id: string;
  name: string;
}

export interface ProductProps {
  _id?: string;
  name: string;
  unit?: string;
  price?: string;
  quantity?: string;
  category?: string;
  addToCart?: boolean;
}
