'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { capitalizeFirstLetter } from '@/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts } from '@/context/ProductContext';
import { PrettyUnitEnum, UnitEnum } from '@/types/enums';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface FormValues {
  name: string;
  price: string;
  unit: UnitEnum;
  quantity: string;
  addToCart: boolean;
}

export const AddProductSheet = () => {
  const { addProduct } = useProducts();
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '',
      price: '',
      quantity: '',
      addToCart: false,
      unit: UnitEnum.unit,
    },
  });

  const onSubmit = (data: FormValues) => {
    addProduct({
      id: Date.now(),
      ...data,
    });

    reset();
  };

  const unit = watch('unit');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Adicionar produto</Button>
      </SheetTrigger>

      <SheetContent>
        <div className="mx-auto w-full max-w-full">
          <SheetHeader>
            <SheetTitle>Adicionar produto</SheetTitle>
            <SheetDescription>Adicione um novo produto à sua lista. Clique em salvar para confirmar.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Produto</Label>

              <Input
                required
                id="name"
                type="text"
                placeholder="Nome do produto"
                {...register('name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>

              <Input
                step="1"
                id="price"
                type="number"
                placeholder="Preço"
                {...register('price')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade/Peso</Label>

              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  placeholder={unit === UnitEnum.unit ? 'Quantidade' : 'Peso'}
                  className="flex-grow"
                  {...register('quantity')}
                />

                <Select
                  value={unit}
                  onValueChange={(value: UnitEnum) => setValue('unit', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Unidade de medida"/>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={UnitEnum.unit}>{capitalizeFirstLetter(PrettyUnitEnum.unit)}</SelectItem>

                    <SelectItem value={UnitEnum.kg}>{capitalizeFirstLetter(PrettyUnitEnum.kg)}</SelectItem>

                    <SelectItem value={UnitEnum.grams}>{capitalizeFirstLetter(PrettyUnitEnum.grams)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="add-to-cart"
                checked={watch('addToCart')}
                onCheckedChange={(checked) => setValue('addToCart', checked as boolean)}
              />

              <Label htmlFor="add-to-cart">Adicionar ao carrinho</Label>
            </div>

            <SheetFooter>
              <Button type="submit">Adicionar produto</Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
