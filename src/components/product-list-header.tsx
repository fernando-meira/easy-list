'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useCategories, useProducts } from '@/context';
import { PrettyStatusEnum, StatusEnum } from '@/types/enums';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from './ui/label';
import { CategorySelect } from './category-select';

export function ProductListHeader() {
  const { filter, setFilter } = useProducts();
  const { isLoadingCategories } = useCategories();

  return (
    <header className="flex items-center justify-between gap-4 w-full">
      {isLoadingCategories ? (
        <Skeleton className="h-9 w-44" />
      ) : (
        <div className="flex items-center gap-4">

          <div className="flex flex-col gap-1">
            <Label className="font-bold text-sm">Filtro de Produtos</Label>

            <Select value={filter} onValueChange={(value: StatusEnum) => setFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtro de produtos" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={StatusEnum.all}>{PrettyStatusEnum.all}</SelectItem>

                <SelectItem value={StatusEnum.inCart}>{PrettyStatusEnum.inCart}</SelectItem>

                <SelectItem value={StatusEnum.outOfCart}>{PrettyStatusEnum.outOfCart}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1" >
            <Label className="font-bold text-sm">Filtro de Categorias</Label>

            <CategorySelect />
          </div>
        </div>
      )}
    </header>
  );
};
