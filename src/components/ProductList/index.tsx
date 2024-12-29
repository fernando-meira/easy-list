'use client';

import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { calculateProductValue } from '@/utils';
import { ProductProps } from '@/types/interfaces';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts } from '@/context/ProductContext';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { LucideShoppingCart, Pencil, Trash2 } from 'lucide-react';
import { ProductListHeader, ProductManagerSheet } from '@/components';

export function ProductList() {
  const { products, filteredProducts, removeProduct, toggleCart } = useProducts();

  const [openEditSheet, setOpenEditSheet] = React.useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = React.useState<ProductProps | undefined>(undefined);

  const renderProducts = useMemo(() => {
    if (!products || products.length === 0) {
      return (
        <div className="flex items-center justify-center w-full h-[200px]">
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
        </div>
      );
    }

    if (products.length > 0 && filteredProducts?.length === 0) {
      return (
        <div className="flex items-center justify-center w-full h-[200px]">
          <p className="text-sm text-muted-foreground">Não existe produtos para esse filtro</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col  mt-4">
        <ul>
          {(filteredProducts || products)?.map((product, index) => (
            <li key={product.id} className={`flex items-center gap-2 p-2 hover:no-underline rounded ${index % 2 !== 0 ? 'bg-stone-100' : ''}`}>
              <div className="flex flex-1 gap-2 items-center">
                <Checkbox
                  id={`cart-${product.id}`}
                  checked={product.addToCart}
                  onCheckedChange={() => toggleCart(product.id)}
                />
                <strong>{product.name}</strong>

                {product.addToCart && (
                  <LucideShoppingCart className="h-4 w-4 text-teal-400" />
                )}
              </div>

              <div className="flex gap-2 align-center">
                {product.quantity && product.unit && (
                  <Badge variant="outline" className="self-center text-xs">{`${product.quantity} ${product.unit}`} { product.price && calculateProductValue({
                    unit: product.unit,
                    price: product.price,
                    quantity: product.quantity,
                  })}</Badge>
                )}
              </div>

              <div className="flex flex-row gap-2">
                <div onClick={() => {setSelectedProducts(product); setOpenEditSheet(true);}} className="flex gap-2 bg-teal-100 p-2 rounded cursor-pointer">
                  <Pencil className="h-4 w-4 text-teal-400" />
                </div>

                <div onClick={() => removeProduct(product.id)} className="flex gap-2 bg-rose-100 p-2 rounded cursor-pointer">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [products, removeProduct, filteredProducts, toggleCart]);

  return (
    <div className="w-full">
      <ProductListHeader />

      {renderProducts}

      <ProductManagerSheet
        open={openEditSheet}
        product={selectedProducts}
        onOpenChange={setOpenEditSheet}
        type={AddOrEditProductTypeEnum.edit}
      />
    </div>
  );
}
