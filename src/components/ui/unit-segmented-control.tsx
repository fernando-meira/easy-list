'use client';

import { cn } from '@/lib/utils';
import { UnitEnum } from '@/types/enums';

const UNIT_OPTIONS = [
  { label: 'Un.', value: UnitEnum.unit },
  { label: 'Kg',  value: UnitEnum.kg },
  { label: 'Gr',  value: UnitEnum.grams },
] as const;

interface UnitSegmentedControlProps {
  value: UnitEnum;
  onChange: (value: UnitEnum) => void;
}

export function UnitSegmentedControl({ value, onChange }: UnitSegmentedControlProps) {
  return (
    <div className="flex w-full gap-1 rounded-lg bg-muted p-1">
      {UNIT_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
            className={cn(
              'flex flex-1 items-center justify-center rounded-md px-3.5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
