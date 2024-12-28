'use client';

import { useProducts } from '@/context/ProductContext';
import { PrettyStatusEnum, StatusEnum } from '@/types/enums';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProductListHeader() {
  const { filter, setFilter } = useProducts();

  return (
    <header className="flex items-center justify-between gap-4 w-full">
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
  );
};
