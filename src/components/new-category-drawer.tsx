'use client';

import React from 'react';

import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { ActionButton } from './action-button';
import { CategoryProps } from '@/types/interfaces';
import { FormProvider, useForm } from 'react-hook-form';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

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
        <ActionButton text="Nova categoria" onClick={() => setOpen?.(true)} />
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
                  <ActionButton text="Adicionar" type="submit" />
                </DrawerFooter>
              </form>
            </FormProvider>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
