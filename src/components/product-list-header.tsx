'use client';

import { toast } from 'sonner';
import { Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts, useCategories } from '@/context';
import { StatusEnum, PrettyStatusEnum } from '@/types/enums';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from '@/components/ui/select';

import { Label } from './ui/label';
import { CategorySelect } from './category-select';

export function ProductListHeader() {
  const { filter, setFilter } = useProducts();
  const { isLoadingCategories, filteredCategory } = useCategories();

  const isOwner = filteredCategory != null && !filteredCategory.isShared;

  async function handleShare() {
    if (!filteredCategory?._id) return;

    try {
      const response = await fetch(`/api/categories/${filteredCategory._id}/share`);

      if (!response.ok) {
        toast.error('Não foi possível gerar o link');
        return;
      }

      const { shareUrl } = await response.json();
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado!');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

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

          <div className="flex flex-col gap-1">
            <Label className="font-bold text-sm">Filtro de Categorias</Label>

            <CategorySelect />
          </div>
        </div>
      )}

      {isOwner && (
        <Button variant="outline" size="sm" onClick={handleShare} className="shrink-0">
          <Share2 className="h-4 w-4 mr-1" />
          Compartilhar
        </Button>
      )}
    </header>
  );
}
