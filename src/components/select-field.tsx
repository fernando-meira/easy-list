'use client';

import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  triggerLabel?: string;
  placeholder?: string;
  getAriaLabel?: (selected?: SelectFieldOption) => string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = '—',
  triggerLabel = 'Trocar',
  emptyLabel = 'Nenhuma opção',
  getAriaLabel,
}: SelectFieldProps) {
  const selected = options.find((option) => option.value === value);
  const ariaLabel = getAriaLabel
    ? getAriaLabel(selected)
    : selected
      ? `${label}: ${selected.label}. Clique para trocar.`
      : `Selecionar ${label.toLowerCase()}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <div className="flex min-w-0 flex-col gap-0.5 text-left">
            <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
              {label}
            </span>
            <span className="truncate text-base font-bold leading-[1.35] text-foreground">
              {selected?.label ?? placeholder}
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-2">
            <span className="text-sm font-bold leading-[1.35] text-foreground">
              {triggerLabel}
            </span>
            <ChevronDown className="h-[15px] w-[15px] text-foreground" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 overflow-y-auto"
      >
        {options.length === 0 ? (
          <DropdownMenuItem disabled>{emptyLabel}</DropdownMenuItem>
        ) : (
          options.map((option) => (
            <DropdownMenuItem
              key={option.value || '__empty__'}
              className={cn('flex items-center gap-2', value === option.value && 'font-bold')}
              onSelect={() => onChange(option.value)}
            >
              {value === option.value ? (
                <Check className="h-4 w-4 flex-shrink-0" />
              ) : (
                <span className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              )}
              {option.label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
