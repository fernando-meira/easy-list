'use client';

import { X, Plus } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useForm, FormProvider } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { CategoryProps } from '@/types/interfaces';

interface NewCategoryDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewCategoryDrawer({ open, onOpenChange }: NewCategoryDrawerProps) {
  const { addCategory } = useCategories();

  const methods = useForm<CategoryProps>({
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    addCategory(data);
    methods.reset();
    onOpenChange?.(false);
  });

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  Nova categoria
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  Digite o nome e a categoria fica disponível imediatamente.
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => onOpenChange?.(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <FormProvider {...methods}>
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

                <div className="flex flex-col gap-2.5">
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background"
                  >
                    <Plus className="h-5 w-5" />
                    Criar categoria
                  </button>

                  <p className="text-[13px] font-medium leading-[1.4] text-[#898989]">
                    Enter também cria quando o nome estiver preenchido.
                  </p>
                </div>
              </form>
            </FormProvider>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
