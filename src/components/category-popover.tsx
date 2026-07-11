'use client';

import { CategoryProps } from '@/types/interfaces';
import { SelectField } from '@/components/select-field';

interface CategoryPopoverProps {
  value: string;
  onChange: (id: string) => void;
  categories: CategoryProps[];
}

export function CategoryPopover({ value, onChange, categories }: CategoryPopoverProps) {
  return (
    <SelectField
      label="Categoria"
      value={value}
      onChange={onChange}
      emptyLabel="Nenhuma categoria"
      options={categories.map((category) => ({ value: category._id, label: category.name }))}
      getAriaLabel={(selected) =>
        selected
          ? `Categoria selecionada: ${selected.label}. Clique para trocar.`
          : 'Selecionar categoria'
      }
    />
  );
}
