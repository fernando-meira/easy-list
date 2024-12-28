'use client';

import React, { useMemo } from 'react';

import { calculateProductValue } from '@/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts } from '@/context/ProductContext';
import { PrettyStatusEnum, StatusEnum } from '@/types/enums';
import { LucideShoppingCart, Pencil, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProductList() {
  const { products, removeProduct } = useProducts();

  const [filter, setFilter] = React.useState<StatusEnum>(StatusEnum.all);

  const renderProducts = useMemo(() => {
    if (products?.length === 0) {
      return (
        <div className="flex items-center justify-center w-full h-[200px]">
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col  mt-4">
        <ul>
          {products?.map((product, index) => (
            <li key={product.id} className={`flex items-center p-2 hover:no-underline rounded ${index % 2 !== 0 ? 'bg-stone-100' : ''}`}>
              <div className="flex flex-1 gap-2 items-center">
                <Checkbox
                  id={`cart-${product.id}`}
                  checked={product.addToCart}
                // onCheckedChange={() => toggleCart(product.id)}
                />
                <strong>{product.name}</strong>

                {product.addToCart && (
                  <LucideShoppingCart className="h-4 w-4 text-teal-400" />
                )}
              </div>

              <div className="flex gap-2 mr-2 align-center">
                {product.quantity && product.unit && (
                  <span>{`${product.quantity} ${product.unit}`}</span>
                )}

                {product.price && product.quantity && product.unit && (
                  <span className="font-semibold text-teal-400">
                    {calculateProductValue({
                      quantity: product.quantity,
                      price: product.price,
                      unit: product.unit,
                    })}
                  </span>
                )}
              </div>

              <div className="flex flex-row gap-2">
                <div onClick={() => {}} className="flex gap-2 bg-teal-100 p-2 rounded cursor-pointer">
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
  }, [products]);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between gap-4 w-full">
        <h3 className="text-lg font-semibold">Lista de produtos</h3>

        <Select value={filter} onValueChange={(value: StatusEnum) => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtro de produtos" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={StatusEnum.all}>{PrettyStatusEnum.all}</SelectItem>

            <SelectItem value={StatusEnum.inCart}>{PrettyStatusEnum.inCart}</SelectItem>

            <SelectItem value={StatusEnum.outOfCart}>{PrettyStatusEnum.outOfCart}</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {renderProducts}
    </div>
  );
}
