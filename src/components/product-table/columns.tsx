'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { calculateProductValue } from '@/utils';
import { UnitEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';
import { Skeleton } from '../ui/skeleton';

export type ProductColumn = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: UnitEnum;
  addToCart: boolean;
};

export const columns = ({
  toggleCart,
  removeProduct,
  onEditProduct,
  isProductLoading,
}: {
  toggleCart: (id: string) => void;
  removeProduct: (id: string) => void;
  onEditProduct: (product: ProductProps) => void;
  isProductLoading: { productId: string | null; isLoading: boolean };
}): ColumnDef<ProductProps>[] => [
  {
    id: 'select',
    header: () => null,
    cell: ({ row }) => {
      const product = row.original;
      if (isProductLoading.isLoading && isProductLoading.productId === product._id) {
        return (
          <div className="flex items-center justify-center min-w-6">
            <Skeleton className="h-5 w-5" />
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center min-w-6">
          <Checkbox
            id={`cart-${product._id}`}
            checked={product?.addToCart}
            onCheckedChange={() => toggleCart(product._id!)}
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div
          className="cursor-pointer"
          onClick={() => onEditProduct(product)}
        >
          <strong>{product.name}</strong>
        </div>
      );
    },
  },
  {
    accessorKey: 'price',
    header: 'Valor/Quantidade',
    cell: ({ row }) => {
      const product = row.original;
      if (!product.price && !product.quantity) return null;
      return (
        <Badge variant="outline" className="self-center text-xs">
          {calculateProductValue({
            price: String(product.price),
            unit: product.unit as UnitEnum,
            quantity: String(product.quantity),
          })}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div
          onClick={() => removeProduct(product._id!)}
          className="w-8 h-8 flex justify-center items-center gap-2 bg-rose-100 dark:bg-transparent p-2 rounded cursor-pointer"
        >
          <Trash2 className="h-4 w-4 text-rose-500" />
        </div>
      );
    },
  },
];
