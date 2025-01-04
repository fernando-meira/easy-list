'use client';

import React from 'react';

import { useCategories } from '@/context';
import { CirclePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        <div className="flex gap-2 bg-teal-200 p-2 rounded cursor-pointer" onClick={() => setOpen?.(true)}>
          <CirclePlus className="h-4 w-4 text-teal-600" />
        </div>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Adicionar categoria</DrawerTitle>

          <DrawerDescription>
            Digite o nome da categoria no campo abaixo para criar uma nova categoria.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="mb-8">
          <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Input
                  required
                  id="name"
                  type="text"
                  placeholder="Nome da categoria"
                  {...methods.register('name')}
                />
              </div>

              <DrawerFooter className="mb-8 p-0">
                <Button type="submit">Adicionar</Button>
              </DrawerFooter>
            </form>
          </FormProvider>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
