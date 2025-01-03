'use client';

import React from 'react';

import { useCategories } from '@/context';
import { CirclePlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryProps } from '@/types/interfaces';
import { FormProvider, useForm } from 'react-hook-form';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

interface NewCategoryDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewCategoryDrawer({
  open,
  onOpenChange,
}: NewCategoryDrawerProps) {
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <CirclePlus />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Adicionar categoria</DrawerTitle>
        </DrawerHeader>

        <DrawerFooter className="mb-8">
          <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="space-y-6 py-6">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nome da categoria</Label>

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
