import { LucideShoppingCart, Trash2 } from 'lucide-react';

import { Badge } from '../ui/badge';
import { useProducts } from '@/context';
import { UnitEnum } from '@/types/enums';
import { Checkbox } from '../ui/checkbox';
import { calculateProductValue } from '@/utils';
import { CategoryProps, ProductProps } from '@/types/interfaces';

interface ProductsListProps {
  category: CategoryProps;
  setOpenEditSheet: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedProducts: React.Dispatch<React.SetStateAction<ProductProps>>;
}

export const ProductsList = ({ category, setSelectedProducts, setOpenEditSheet }: ProductsListProps) => {
  const { removeProduct, toggleCart } = useProducts();

  if (!category) {
    return null;
  }

  return (
    category.products?.map((product, index) => {
      return (
        <div key={`${product._id}-${index}-${category._id}-${Math.random()}`}>
          <div key={product._id} className="flex flex-col">
            <div key={product._id} className={`flex items-center gap-2 p-2 hover:no-underline rounded ${index % 2 !== 0 ? 'bg-stone-100' : ''}`}>
              {!!product?._id && (
                <Checkbox
                  id={`cart-${product._id}`}
                  checked={product?.addToCart}
                  onCheckedChange={() => toggleCart(product._id!)}
                />
              )}

              <div onClick={() => {setSelectedProducts(product); setOpenEditSheet(true);}} className="flex flex-1 gap-2 items-center cursor-pointer">
                <div className="flex flex-1 gap-2 items-center">
                  <strong>{product.name}</strong>
                  {product.addToCart && (
                    <LucideShoppingCart className="h-4 w-4 text-teal-400" />
                  )}
                </div>

                <div className="flex gap-2 align-center">
                  {product.quantity && product.unit && (
                    <Badge variant="outline" className="self-center text-xs">{`${String(product.quantity)} ${product.unit}`} { product.price && calculateProductValue({
                      price: String(product.price),
                      unit: product.unit as UnitEnum,
                      quantity: String(product.quantity),
                    })}</Badge>
                  )}
                </div>
              </div>

              <div>
                <div onClick={() => removeProduct(product._id!)} className="flex gap-2 bg-rose-100 p-2 rounded cursor-pointer">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })
  );
};
