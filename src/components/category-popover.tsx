'use client';

import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CategoryProps } from '@/types/interfaces';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CategoryPopoverProps {
  value: string;
  onChange: (id: string) => void;
  categories: CategoryProps[];
}

export function CategoryPopover({ value, onChange, categories }: CategoryPopoverProps) {
  const selected = categories.find((c) => c._id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={selected ? `Categoria selecionada: ${selected.name}. Clique para trocar.` : 'Selecionar categoria'}
          className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-[#f5f5f5] px-3.5 dark:border-[#242424] dark:bg-[#1a1a1a]"
        >
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
              Categoria
            </span>
            <span className="text-base font-bold leading-[1.35] text-foreground">
              {selected?.name ?? '—'}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-2 dark:border-[#242424] dark:bg-[#101010]">
            <span className="text-sm font-bold leading-[1.35] text-foreground">Trocar</span>
            <ChevronDown className="h-[15px] w-[15px] text-foreground" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        {categories.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma categoria</DropdownMenuItem>
        ) : (
          categories.map((category) => (
            <DropdownMenuItem
              key={category._id}
              className={cn('flex items-center gap-2', value === category._id && 'font-bold')}
              onSelect={() => onChange(category._id)}
            >
              {value === category._id ? (
                <Check className="h-4 w-4 flex-shrink-0" />
              ) : (
                <span className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              )}
              {category.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
