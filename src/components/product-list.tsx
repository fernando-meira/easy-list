import { Trash2 } from 'lucide-react';

import { Badge } from './ui/badge';
import { useProducts } from '@/context';
import { Checkbox } from './ui/checkbox';
import { calculateProductValue } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusEnum, UnitEnum } from '@/types/enums';
import { CategoryProps, ProductProps } from '@/types/interfaces';

interface ProductsListProps {
  category: CategoryProps;
  setOpenEditSheet: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedProducts: React.Dispatch<React.SetStateAction<ProductProps>>;
}

export const ProductsList = ({ category, setSelectedProducts, setOpenEditSheet }: ProductsListProps) => {
  const { removeProduct, toggleCart, filter, isProductLoading } = useProducts();

  const productsToShow = category.products?.filter(product => {
    if (filter === StatusEnum.all) return true;
    if (filter === StatusEnum.inCart) return product.addToCart;
    return !product.addToCart;
  });

  if (!category || !productsToShow || productsToShow.length === 0) {
    return (
      <div className="flex items-center justify-center w-full p-2">
        <p>Não existe produtos cadastrados para essa categoria</p>
      </div>);
  }

  return (
    productsToShow?.map((product, index) => {
      if (isProductLoading.productId === product._id) {
        return (
          <Skeleton key={`${product._id}-${index}-${category._id}-${Math.random()}`} className="h-12" />
        );
      }

      return (
        <div key={`${product._id}-${index}-${category._id}-${Math.random()}`}>
          <div key={product._id} className="flex flex-col">
            <div key={product._id} className={`flex items-center gap-2 p-2 hover:no-underline rounded ${index % 2 !== 0 ? 'bg-stone-100 dark:bg-muted/50' : ''}`}>
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
                </div>

                {(product.price || product.quantity) &&
                  <div className="flex gap-2 align-center">
                    <Badge variant="outline" className="self-center text-xs">
                      {calculateProductValue({
                        price: String(product.price),
                        unit: product.unit as UnitEnum,
                        quantity: String(product.quantity),
                      })}
                    </Badge>
                  </div>
                }

              </div>

              <div>
                <div onClick={() => removeProduct(product._id!)} className="flex gap-2 bg-rose-100 dark:bg-transparent p-2 rounded cursor-pointer">
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
