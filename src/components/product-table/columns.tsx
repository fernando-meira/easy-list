'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { UnitEnum } from '@/types/enums';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';
import { calculateProductValue } from '@/utils';
import { ProductProps } from '@/types/interfaces';

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
  isProductLoading,
}: {
  toggleCart: (id: string) => void;
  removeProduct: (id: string) => void;
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
        <div>
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
        <div className="text-xs">
          {calculateProductValue({
            price: String(product.price),
            unit: product.unit as UnitEnum,
            quantity: String(product.quantity),
          })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div
          onClick={(e) => {
            e.preventDefault();
            removeProduct(product._id!);
          }}
          className="min-w-8 min-h-8 w-full h-full flex justify-center items-center gap-2 bg-rose-100 dark:bg-transparent p-2 rounded cursor-pointer"
        >
          <Trash2 className="h-4 w-4 text-rose-500" />
        </div>
      );
    },
  },
];
