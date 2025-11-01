'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { useCategories } from '@/context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ActionButton } from './action-button';
import { capitalizeFirstLetter } from '@/utils';
import { CirclePlus, Edit } from 'lucide-react';
import { CurrencyInput } from './currency-input';
import { ProductProps } from '@/types/interfaces';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts } from '@/context/ProductContext';
import { AddOrEditProductTypeEnum, UnitEnum } from '@/types/enums';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductManagerSheetProps {
  open?: boolean;
  product?: ProductProps;
  type?: AddOrEditProductTypeEnum;
  onOpenChange?: (open: boolean) => void;
}

export const ProductManagerDrawer = ({ open, type, product, onOpenChange }: ProductManagerSheetProps) => {
  const { managerProduct, isProductLoading } = useProducts();
  const { categories, selectedCategoryId, isLoadingCategories } = useCategories();

  const methods = useForm<Omit<ProductProps, 'category'> & { categoryId: string }>({
    defaultValues: {
      name: '',
      price: '',
      quantity: '',
      addToCart: false,
      unit: UnitEnum.unit,
      ...product && {
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        addToCart: product.addToCart,
        unit: product.unit,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      },
      categoryId: selectedCategoryId || product?.category?._id || product?.categoryId || categories[0]?._id || '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    const productData = {
      ...data,
      categoryId: data.categoryId,
    };

    managerProduct({ product: productData });

    methods.reset();
    onOpenChange?.(false);
  });

  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);

  const fetchProduct = React.useCallback(async (productId: string) => {
    try {
      setIsLoadingProduct(true);

      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();

      methods.reset({
        _id: data._id,
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        addToCart: data.addToCart,
        unit: data.unit,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        categoryId: selectedCategoryId || data.category?._id,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoadingProduct(false);
    }
  }, [methods, selectedCategoryId]);

  React.useEffect(() => {
    if (!open) return;

    if (product?._id && type === AddOrEditProductTypeEnum.edit) {
      fetchProduct(product._id);
    }

    if (type === AddOrEditProductTypeEnum.add && categories.length > 0) {
      methods.reset({
        name: '',
        price: '',
        quantity: '1',
        addToCart: false,
        unit: UnitEnum.unit,
        categoryId: selectedCategoryId,
      }, { keepDefaultValues: true });
    }
  }, [open, product?._id, type, categories.length, fetchProduct, categories, methods, selectedCategoryId]);

  const [unit, categoryId] = methods.watch(['unit', 'categoryId']);

  const isLoading = isLoadingCategories || isProductLoading.isLoading || isLoadingProduct;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} key={type}>
      {type === AddOrEditProductTypeEnum.add && (
        <DrawerTrigger asChild>
          <ActionButton text="Novo produto" icon={CirclePlus}/>
        </DrawerTrigger>
      )}

      {isLoading ? (
        <></>
      ) : (
        <DrawerContent className="flex flex-col">
          <DrawerHeader className="space-y-2 flex-shrink-0">
            <DrawerTitle>{type === AddOrEditProductTypeEnum.edit ? 'Editar' : 'Adicionar'} produto</DrawerTitle>

            <DrawerDescription>
              {type === AddOrEditProductTypeEnum.edit
                ? 'Faça alterações no seu produto aqui. Clique em salvar quando terminar.'
                : 'Adicione um novo produto aqui. Clique em salvar quando terminar.'}
            </DrawerDescription>
          </DrawerHeader>

          <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
              <div className='flex-1 overflow-y-auto px-4 space-y-4 pb-4'>
                <div className='flex gap-2 w-full'>
                  <div className='w-full'>
                    <Label htmlFor="name">Produto</Label>

                    <Input
                      required
                      id="name"
                      type="text"
                      placeholder="Nome do produto"
                      {...methods.register('name')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoryId">Categoria</Label>

                    <Select
                      required
                      value={categoryId}
                      onValueChange={(value: string) => {
                        methods.setValue('categoryId', value, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger>
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

                <div className="flex gap-2">
                  <div>
                    <CurrencyInput
                      label="Preço"
                      placeholder="Preço"
                      value={methods.watch('price')}
                      onValueChange={(value) => methods.setValue('price', value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Qtd/Peso</Label>

                    <Input
                      min={0}
                      step={0.1}
                      id="quantity"
                      type="number"
                      placeholder={unit === UnitEnum.unit || unit === undefined ? 'Qtd.' : 'Peso'}
                      {...methods.register('quantity')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Medida</Label>

                    <Select
                      defaultValue={UnitEnum.unit}
                      value={unit || UnitEnum.unit}
                      onValueChange={(value: UnitEnum) => methods.setValue('unit', value)}
                    >
                      <SelectTrigger >
                        <SelectValue placeholder="Medida"/>
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={UnitEnum.unit}>{capitalizeFirstLetter(UnitEnum.unit)}</SelectItem>

                        <SelectItem value={UnitEnum.kg}>{capitalizeFirstLetter(UnitEnum.kg)}</SelectItem>

                        <SelectItem value={UnitEnum.grams}>{capitalizeFirstLetter(UnitEnum.grams)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-to-cart"
                    checked={methods.watch('addToCart')}
                    onCheckedChange={(checked) => methods.setValue('addToCart', checked as boolean)}
                  />

                  <Label htmlFor="add-to-cart">Adicionar ao carrinho</Label>
                </div>
              </div>

              <DrawerFooter className="flex-shrink-0 border-t bg-background">
                <ActionButton icon={type === AddOrEditProductTypeEnum.edit ? Edit : CirclePlus} text={type === AddOrEditProductTypeEnum.edit ? 'Editar produto' : 'Adicionar produto'} disabled={isLoadingCategories || isProductLoading.isLoading || isLoadingProduct} type="submit"/>
              </DrawerFooter>
            </form>
          </FormProvider>
        </DrawerContent>
      )}

    </Drawer>
  );
};
