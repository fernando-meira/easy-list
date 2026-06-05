'use client';

import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      <SelectTrigger className="h-16 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] px-[14px] py-[13px] flex justify-between items-center [&>svg]:hidden w-full">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[10px] font-semibold leading-none text-[var(--color-muted)]">
            Lista atual
          </span>
          <span className="text-[14px] font-semibold leading-none text-[var(--color-ink)]">
            {selectedName}
          </span>
        </div>
        <ChevronDown className="w-[18px] h-[18px] text-[var(--color-ink)] shrink-0" />
      </SelectTrigger>

      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category._id} value={category._id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
