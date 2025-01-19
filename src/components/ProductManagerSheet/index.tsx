'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { useCategories } from '@/context';
import { CirclePlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { capitalizeFirstLetter } from '@/utils';
import { Button } from '@/components/ui/button';
import { ProductProps } from '@/types/interfaces';
import useWindowSize from '@/hooks/useWindowSize';
import { Checkbox } from '@/components/ui/checkbox';
import { MoneyInput } from '@/components/MoneyInput';
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
import { useCallback, useState } from 'react';

interface ProductManagerSheetProps {
  open?: boolean;
  product?: ProductProps;
  type?: AddOrEditProductTypeEnum;
  onOpenChange?: (open: boolean) => void;
}

export const ProductManagerSheet = ({ open, type, product, onOpenChange }: ProductManagerSheetProps) => {
  const { isSmallSize } = useWindowSize();
  const { managerProduct, isProductLoading } = useProducts();
  const { categories, isLoadingCategories } = useCategories();

  const methods = useForm<ProductProps>({
    defaultValues: {
      name: '',
      price: '',
      quantity: '',
      addToCart: false,
      unit: UnitEnum.unit,
      ...product,
      categoryId: product?.category?._id || product?.categoryId || categories[0]?._id || '',
    },
  });

  const onSubmit = methods.handleSubmit((data: ProductProps) => {
    const productData = {
      ...data,
      categoryId: data.categoryId,
    };

    managerProduct({ product: productData });

    methods.reset();
    onOpenChange?.(false);
  });

  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      setIsLoadingProduct(true);
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      methods.reset({
        ...data,
        categoryId: data.category?._id,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoadingProduct(false);
    }
  }, [methods]);

  React.useEffect(() => {
    if (!open) return;

    if (product?._id && type === AddOrEditProductTypeEnum.edit) {
      fetchProduct(product._id);
    } else if (type === AddOrEditProductTypeEnum.add && categories.length > 0) {
      methods.reset({
        categoryId: categories[0]?._id,
        unit: UnitEnum.unit,
        name: '',
        price: '',
        quantity: '',
        addToCart: false,
      }, { keepDefaultValues: true });
    }
  }, [open, product?._id, type, categories.length, fetchProduct, categories, methods]);

  const [unit, categoryId] = methods.watch(['unit', 'categoryId']);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} key={type}>
      {type === AddOrEditProductTypeEnum.add && (
        <SheetTrigger asChild>
          <div className="flex gap-2 bg-teal-200 p-2 rounded cursor-pointer">
            <CirclePlus className="h-4 w-4 text-teal-600" />
          </div>
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
                  placeholder={unit === UnitEnum.unit || unit === undefined ? 'Quantidade' : 'Peso'}
                  {...methods.register('quantity')}
                />

                <Select
                  defaultValue={UnitEnum.unit}
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
                  required
                  value={categoryId}
                  onValueChange={(value: string) => {
                    methods.setValue('categoryId', value, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria"/>
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
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
              <Button disabled={isLoadingCategories || isProductLoading.isLoading || isLoadingProduct} type="submit">{type === AddOrEditProductTypeEnum.edit ? 'Editar produto' : 'Adicionar produto'}</Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};
