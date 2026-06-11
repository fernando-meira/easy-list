'use client';

import { Plus, Save } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { CategoryProps } from '@/types/interfaces';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

interface NewCategoryDrawerProps {
  open?: boolean;
  categoryToEdit?: CategoryProps;
  onOpenChange?: (open: boolean) => void;
}

export function NewCategoryDrawer({ open, onOpenChange, categoryToEdit }: NewCategoryDrawerProps) {
  const { addCategory, updateCategory } = useCategories();
  const isEditMode = Boolean(categoryToEdit);

  const methods = useForm<CategoryProps>({
    defaultValues: {
      name: categoryToEdit?.name ?? '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    if (isEditMode && categoryToEdit) {
      updateCategory(categoryToEdit._id, data.name);
    } else {
      addCategory({ name: data.name } as CategoryProps);
    }
    methods.reset();
    onOpenChange?.(false);
  });

  return (
    <ResponsiveProductDialog
      open={open}
      title={isEditMode ? 'Editar categoria' : 'Nova categoria'}
      description="Digite o nome e a categoria fica disponível imediatamente."
      onOpenChange={(value) => {
        if (!value) methods.reset();
        onOpenChange?.(value);
      }}
      footer={(
        <div className="flex flex-col gap-2.5">
          <button
            type="submit"
            form="new-category-form"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background"
          >
            {isEditMode ? (
              <>
                <Save className="h-5 w-5" />
                Salvar
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Criar categoria
              </>
            )}
          </button>

          <p className="text-[13px] font-medium leading-[1.4] text-[#898989]">
            Enter também {isEditMode ? 'salva' : 'cria'} quando o nome estiver preenchido.
          </p>
        </div>
      )}
    >
      <FormProvider {...methods}>
        <form id="new-category-form" onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-[7px]">
            <span className="text-[13px] font-bold leading-[1.35] text-foreground">
              Categoria
            </span>
            <Input
              required
              id="name"
              type="text"
              placeholder="Nome da categoria"
              className="h-10 rounded-lg px-3.5 text-base font-semibold"
              {...methods.register('name')}
            />
          </div>
        </form>
      </FormProvider>
    </ResponsiveProductDialog>
  );
}
