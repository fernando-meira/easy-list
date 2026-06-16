'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SectionHeaderProps {
  count: number;
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SectionHeader({ title, count, isCollapsed, onToggle }: SectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className='flex w-full items-center justify-between'
    >
      <span className='text-base font-semibold text-[var(--color-ink)]'>{title}</span>
      <div className='flex items-center gap-2'>
        <div className='flex h-6 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]'>
          <span className='text-[12px] font-semibold text-[var(--color-on-primary)]'>{count}</span>
        </div>
        <ChevronDown
          aria-hidden='true'
          className={cn(
            'h-4 w-4 text-[var(--color-muted)] transition-transform duration-200',
            isCollapsed && '-rotate-90'
          )}
        />
      </div>
    </button>
  );
}
