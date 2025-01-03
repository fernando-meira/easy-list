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

export function ProductListHeader() {
  const { categories } = useCategories();
  const { filter, setFilter, isLoading } = useProducts();

  return (
    <header className="flex items-center justify-between gap-4 w-full">
      {isLoading ? (
        <Skeleton className="h-9 w-44" />
      ) : (
        <div className="flex items-center gap-4">
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

          <Select onValueChange={(value) => {console.log(value);}}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categorias" />
            </SelectTrigger>

            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category.name}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </header>
  );
};
