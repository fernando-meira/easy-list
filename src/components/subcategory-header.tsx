'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SubcategoryHeaderProps {
  count: number;
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SubcategoryHeader({ count, title, isCollapsed, onToggle }: SubcategoryHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-1"
    >
      <ChevronDown
        aria-hidden="true"
        className={cn(
          'h-3.5 w-3.5 text-[var(--color-muted)] transition-transform duration-200',
          isCollapsed && '-rotate-90'
        )}
      />
      <span className="text-[13px] font-semibold text-[var(--color-muted)]">{title}</span>
      <span className="text-[12px] font-medium text-[var(--color-muted)]">{count}</span>
    </button>
  );
}
