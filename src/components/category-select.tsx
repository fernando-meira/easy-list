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
      <SelectTrigger
        aria-label={`Lista atual: ${selectedName}. Trocar de lista`}
        className="relative flex h-auto w-fit items-center gap-1 rounded-sm border-0 bg-transparent p-0 py-0.5 text-[12px] font-semibold leading-none text-[var(--color-ink)] shadow-none before:absolute before:-inset-x-1.5 before:-inset-y-2.5 before:content-[''] focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] [&>svg]:hidden"
      >
        <span className="max-w-[55vw] truncate" aria-current="page">{selectedName}</span>
        <span className="flex shrink-0 items-center">
          <ChevronDown className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden="true" />
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
