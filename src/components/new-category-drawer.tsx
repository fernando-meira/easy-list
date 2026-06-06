'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { CategoryProps } from '@/types/interfaces';
import {
  Drawer,
  DrawerTitle,
  DrawerFooter,
  DrawerHeader,
  DrawerContent,
  DrawerTrigger,
  DrawerDescription
} from '@/components/ui/drawer';

import { ActionButton } from './action-button';

export function NewCategoryDrawer() {
  const { addCategory } = useCategories();
  const [open, setOpen] = React.useState<boolean>(false);

  const methods = useForm<CategoryProps>({
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    addCategory(data);

    methods.reset();
    setOpen?.(false);
  });

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          onClick={() => setOpen?.(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] transition-opacity active:opacity-80"
          aria-label="Adicionar categoria"
        >
          <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
          <span className="text-sm font-semibold text-[var(--color-on-primary)]">
            Adicionar categoria
          </span>
        </button>
      </DrawerTrigger>

      <DrawerContent className='max-w-3xl my-0 mx-auto'>
        <div className="mx-auto w-full max-w-lg">

          <DrawerHeader>
            <DrawerTitle>Adicionar categoria</DrawerTitle>

            <DrawerDescription>
            Digite o nome da categoria no campo abaixo para criar uma nova categoria.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter>
            <FormProvider {...methods}>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className='px-4 space-y-4'>
                  <Input
                    required
                    id="name"
                    type="text"
                    placeholder="Nome da categoria"
                    {...methods.register('name')}
                  />
                </div>

                <DrawerFooter className="mt-4">
                  <ActionButton type="submit" icon={Plus}/>
                </DrawerFooter>
              </form>
            </FormProvider>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
