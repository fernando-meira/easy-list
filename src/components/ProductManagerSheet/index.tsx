'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { useCategories } from '@/context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { capitalizeFirstLetter } from '@/utils';
import { Button } from '@/components/ui/button';
import { ProductProps } from '@/types/interfaces';
import { Checkbox } from '@/components/ui/checkbox';
import { MoneyInput } from '@/components/MoneyInput';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useProducts } from '@/context/ProductContext';
import { AddOrEditProductTypeEnum, UnitEnum } from '@/types/enums';
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

interface ProductManagerSheetProps {
  open?: boolean;
  product?: ProductProps;
  type?: AddOrEditProductTypeEnum;
  onOpenChange?: (open: boolean) => void;
}

export const ProductManagerSheet = ({ open, type, product, onOpenChange }: ProductManagerSheetProps) => {
  const { categories } = useCategories();
  const { isSmallSize } = useWindowSize();
  const { managerProduct, isLoading, isProductLoading } = useProducts();

  const methods = useForm<ProductProps>({
    defaultValues: product || {
      name: '',
      price: '',
      quantity: '',
      categoryId: '',
      addToCart: false,
      unit: UnitEnum.unit,
    },
  });

  const onSubmit = methods.handleSubmit((data: ProductProps) => {
    managerProduct({ product: data });

    methods.reset();
    onOpenChange?.(false);
  });

  const unit = methods.watch('unit');
  console.log('🥲  unit:', unit);
  const categoryId = methods.watch('categoryId');

  React.useEffect(() => {
    if (product && type === AddOrEditProductTypeEnum.edit) {
      methods.reset({
        ...product,
        categoryId: product.category?._id,
      });
    } else {
      methods.reset({
        categoryId: categories[0]?._id,
      });
    }
  }, [product, type, methods, categories]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} key={type}>
      {type === AddOrEditProductTypeEnum.add && (
        <SheetTrigger asChild>
          <Button variant="outline">Adicionar produto</Button>
        </SheetTrigger>
      )}

      <SheetContent className="sm:w-[540px]" side={isSmallSize ? 'bottom' : 'right'}>
        <SheetHeader>
          <SheetTitle>{type === AddOrEditProductTypeEnum.edit ? 'Editar' : 'Adicionar'} produto</SheetTitle>

          <SheetDescription>
            {type === AddOrEditProductTypeEnum.edit
              ? 'Faça alterações no seu produto aqui. Clique em salvar quando terminar.'
              : 'Adicione um novo produto aqui. Clique em salvar quando terminar.'}
          </SheetDescription>
        </SheetHeader>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-6 py-6">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Produto</Label>

              <Input
                required
                id="name"
                type="text"
                placeholder="Nome do produto"
                {...methods.register('name')}
              />
            </div>

            <div className="space-y-2">
              <MoneyInput
                label="Preço"
                form={methods}
                placeholder="Preço"
                {...methods.register('price')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade/Peso</Label>

              <div className="flex gap-2">
                <Input
                  min={0}
                  step={0.1}
                  id="quantity"
                  type="number"
                  className="flex-grow"
                  placeholder={unit === UnitEnum.unit ? 'Quantidade' : 'Peso'}
                  {...methods.register('quantity')}
                />

                <Select
                  value={unit || UnitEnum.unit}
                  onValueChange={(value: UnitEnum) => methods.setValue('unit', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Medida"/>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={UnitEnum.unit}>{capitalizeFirstLetter(UnitEnum.unit)}</SelectItem>

                    <SelectItem value={UnitEnum.kg}>{capitalizeFirstLetter(UnitEnum.kg)}</SelectItem>

                    <SelectItem value={UnitEnum.grams}>{capitalizeFirstLetter(UnitEnum.grams)}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={categoryId}
                  onValueChange={(value: string) => methods.setValue('categoryId', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria"/>
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="add-to-cart"
                checked={methods.watch('addToCart')}
                onCheckedChange={(checked) => methods.setValue('addToCart', checked as boolean)}
              />

              <Label htmlFor="add-to-cart">Adicionar ao carrinho</Label>
            </div>

            <SheetFooter>
              <Button disabled={isLoading || isProductLoading.isLoading} type="submit">{type === AddOrEditProductTypeEnum.edit ? 'Editar produto' : 'Adicionar produto'}</Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};
