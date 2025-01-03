export interface CategoryProps {
  _id?: string;
  name: string;
}

export interface ProductProps {
  _id?: string;
  name: string;
  unit?: string;
  price?: string;
  quantity?: string;
  addToCart?: boolean;
}
