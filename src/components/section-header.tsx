'use client';

import { Check, Minus, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  count: number;
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onToggleAll?: () => void;
  isAllSelected?: boolean;
  indeterminate?: boolean;
}

export function SectionHeader({
  count,
  title,
  isCollapsed,
  onToggle,
  onToggleAll,
  isAllSelected,
  indeterminate,
}: SectionHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleAll && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAll();
            }}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              isAllSelected || indeterminate
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                : 'bg-[var(--color-canvas)] border-[var(--color-hairline)] hover:border-[var(--color-ink)]'
            )}
            aria-label={`Selecionar todos em ${title}`}
            title={`Selecionar todos em ${title}`}
          >
            {isAllSelected && (
              <Check className="h-3.5 w-3.5 text-[var(--color-on-primary)]" />
            )}
            {!isAllSelected && indeterminate && (
              <Minus className="h-3.5 w-3.5 text-[var(--color-on-primary)]" />
            )}
          </button>
        )}
        <button
          onClick={onToggle}
          type="button"
          className="flex items-center text-left truncate focus:outline-none"
        >
          <span className="text-base font-semibold text-[var(--color-ink)] truncate">{title}</span>
        </button>
      </div>

      <button
        onClick={onToggle}
        type="button"
        className="flex items-center gap-2 shrink-0 focus:outline-none"
      >
        <div className="flex h-6 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]">
          <span className="text-[12px] font-semibold text-[var(--color-on-primary)]">{count}</span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 text-[var(--color-muted)] transition-transform duration-200',
            isCollapsed && '-rotate-90'
          )}
        />
      </button>
    </div>
  );
}
