'use client';

import { useRouter } from 'next/navigation';
import { Users, ChevronDown } from 'lucide-react';

import { useCategories } from '@/context';
import { Select, SelectItem, SelectContent, SelectTrigger } from '@/components/ui/select';

export function CategorySelect() {
  const router = useRouter();
  const { categories, selectedCategoryId, setSelectedCategoryId } = useCategories();

  const selectedName =
    categories.find(c => c._id === selectedCategoryId)?.name ?? '';

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    router.push(`/category?id=${value}`);
  };

  return (
    <Select value={selectedCategoryId || ''} onValueChange={handleCategoryChange}>
      <SelectTrigger className="flex h-16 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface-card)] px-[14px] py-[13px] shadow-none [&>svg]:hidden">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[3px]">
          <span className="text-[10px] font-bold leading-none text-[var(--color-muted)]">
            Lista atual
          </span>
          <span className="w-full truncate text-left text-[14px] font-semibold leading-[1.15] text-[var(--color-ink)]">
            {selectedName}
          </span>
        </div>
        <span className="flex shrink-0 items-center">
          <ChevronDown className="h-[18px] w-[18px] text-[var(--color-ink)]" />
        </span>
      </SelectTrigger>

      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category._id} value={category._id}>
            <span className="flex items-center gap-1.5">
              {category.name}
              {category.isShared && (
                <Users aria-hidden="true" className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
