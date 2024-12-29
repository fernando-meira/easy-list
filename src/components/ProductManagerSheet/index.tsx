'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { capitalizeFirstLetter } from '@/utils';
import { Button } from '@/components/ui/button';
import { ProductProps } from '@/types/interfaces';
import { Checkbox } from '@/components/ui/checkbox';
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
  const { addProduct, editProduct } = useProducts();

  const { register, handleSubmit, reset, watch, setValue } = useForm<ProductProps>({
    defaultValues: product || {
      name: '',
      price: '',
      quantity: '',
      addToCart: false,
      unit: UnitEnum.unit,
    },
  });

  const onSubmit = (data: ProductProps) => {
    if (type === AddOrEditProductTypeEnum.edit && product) {
      editProduct({ id: product.id, product: data });

    } else {
      addProduct({
        ...data,
        id: Number(Date.now()),
      });
    }

    reset();

    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const unit = watch('unit');

  React.useEffect(() => {
    if (product && type === AddOrEditProductTypeEnum.edit) {
      reset(product);
    }
  }, [product, type, reset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {type === AddOrEditProductTypeEnum.add && (
        <SheetTrigger asChild>
          <Button variant="outline">Adicionar produto</Button>
        </SheetTrigger>
      )}

      <SheetContent>
        <div className="mx-auto w-full max-w-full">
          <SheetHeader>
            <SheetTitle>{type === AddOrEditProductTypeEnum.edit ? 'Editar produto' : 'Adicionar produto'}</SheetTitle>
            <SheetDescription>{type === AddOrEditProductTypeEnum.edit ? 'Edite o produto selecionado' : 'Adicione um novo produto à sua lista. Clique em salvar para confirmar.'}</SheetDescription>
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
                  className="flex-grow"
                  placeholder={unit === UnitEnum.unit ? 'Quantidade' : 'Peso'}
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
                    <SelectItem value={UnitEnum.unit}>{capitalizeFirstLetter(UnitEnum.unit)}</SelectItem>

                    <SelectItem value={UnitEnum.kg}>{capitalizeFirstLetter(UnitEnum.kg)}</SelectItem>

                    <SelectItem value={UnitEnum.grams}>{capitalizeFirstLetter(UnitEnum.grams)}</SelectItem>
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
              <Button type="submit">{type === AddOrEditProductTypeEnum.edit ? 'Editar produto' : 'Adicionar produto'}</Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
