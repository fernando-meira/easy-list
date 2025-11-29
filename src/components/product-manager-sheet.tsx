'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, CirclePlus, Edit, ShoppingCart, X } from 'lucide-react';

import { useCategories } from '@/context';
import { useProducts } from '@/context/ProductContext';
import { AddOrEditProductTypeEnum, UnitEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';
import { capitalizeFirstLetter } from '@/utils';
import { ActionButton } from './action-button';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from './currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export const ProductManagerSheet = ({
  open,
  type,
  product,
  onOpenChange,
}: ProductManagerSheetProps) => {
  const { managerProduct, isProductLoading } = useProducts();
  const { categories, selectedCategoryId, isLoadingCategories } = useCategories();

  const methods = useForm<Omit<ProductProps, 'category'> & { categoryId: string }>({
    defaultValues: {
      name: '',
      price: '',
      quantity: '',
      addToCart: false,
      unit: UnitEnum.unit,
      ...(product && {
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        addToCart: product.addToCart,
        unit: product.unit,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }),
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

  const fetchProduct = React.useCallback(
    async (productId: string) => {
      try {
        setIsLoadingProduct(true);

        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) throw new Error('Failed to fetch product');

        const data = await response.json();

        methods.reset({
          _id: data._id,
          name: data.name,
          unit: data.unit,
          price: data.price,
          quantity: data.quantity,
          addToCart: data.addToCart,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          categoryId: selectedCategoryId || data.category?._id,
        });
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoadingProduct(false);
      }
    },
    [methods, selectedCategoryId]
  );

  React.useEffect(() => {
    if (!open) return;

    if (product?._id && type === AddOrEditProductTypeEnum.edit) {
      fetchProduct(product._id);
    }

    if (type === AddOrEditProductTypeEnum.add && categories.length > 0) {
      methods.reset(
        {
          name: '',
          price: '',
          quantity: '1',
          addToCart: false,
          unit: UnitEnum.unit,
          categoryId: selectedCategoryId,
        },
        { keepDefaultValues: true }
      );
    }
  }, [open, product?._id, type, categories.length, fetchProduct, categories, methods, selectedCategoryId]);

  const [unit, categoryId] = methods.watch(['unit', 'categoryId']);

  const isLoading = isLoadingCategories || isProductLoading.isLoading || isLoadingProduct;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {type === AddOrEditProductTypeEnum.add && (
        <DialogPrimitive.Trigger asChild>
          <ActionButton icon={CirclePlus} />
        </DialogPrimitive.Trigger>
      )}

      {isLoading ? null : (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />

          <DialogPrimitive.Content
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-full flex-col bg-background shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=open]:duration-300 data-[state=closed]:duration-300 sm:max-w-lg"
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => onOpenChange?.(false)}
              className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-2 px-6 pt-6 pb-2 text-left">
              <DialogPrimitive.Title className="text-lg font-semibold">
                {type === AddOrEditProductTypeEnum.edit ? 'Editar' : 'Adicionar'} produto
              </DialogPrimitive.Title>

              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {type === AddOrEditProductTypeEnum.edit
                  ? 'Faça alterações no seu produto aqui. Clique em salvar quando terminar.'
                  : 'Adicione um novo produto aqui. Clique em salvar quando terminar.'}
              </DialogPrimitive.Description>
            </div>

            <FormProvider {...methods}>
              <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-6 pb-4">
                  <div className="flex w-full gap-2">
                    <div className="w-full">
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
                          <SelectValue placeholder="Categoria" />
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
                        <SelectTrigger>
                          <SelectValue placeholder="Medida" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value={UnitEnum.unit}>{capitalizeFirstLetter(UnitEnum.unit)}</SelectItem>

                          <SelectItem value={UnitEnum.kg}>{capitalizeFirstLetter(UnitEnum.kg)}</SelectItem>

                          <SelectItem value={UnitEnum.grams}>{capitalizeFirstLetter(UnitEnum.grams)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Checkbox
                      id="add-to-cart"
                      className='w-6 h-6'
                      checked={methods.watch('addToCart')}
                      onCheckedChange={(checked) => methods.setValue('addToCart', checked as boolean)}
                    />

                    <ArrowLeft  className='text-teal-400'/> <ShoppingCart className=''/>
                  </div>
                </div>

                <ActionButton
                  type="submit"
                  icon={type === AddOrEditProductTypeEnum.edit ? Edit : CirclePlus}
                  disabled={isLoadingCategories || isProductLoading.isLoading || isLoadingProduct}
                />
              </form>
            </FormProvider>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
};
