'use client';

import * as React from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useForm, FormProvider } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { ProductProps } from '@/types/interfaces';
import { useProducts } from '@/context/ProductContext';
import { CartToggleRow } from '@/components/ui/cart-toggle-row';
import { UnitEnum, AddOrEditProductTypeEnum } from '@/types/enums';
import { UnitSegmentedControl } from '@/components/ui/unit-segmented-control';

import { CurrencyInput } from './currency-input';
import { CategoryPopover } from './category-popover';

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

  const isEdit = type === AddOrEditProductTypeEnum.edit;

  const methods = useForm<Omit<ProductProps, 'category'> & { categoryId: string }>({
    defaultValues: {
      name: '',
      price: '',
      quantity: '',
      addToCart: false,
      unit: UnitEnum.unit,
      categoryId:
        selectedCategoryId ||
        product?.category?._id ||
        product?.categoryId ||
        categories[0]?._id ||
        '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    managerProduct({ product: { ...data, categoryId: data.categoryId } });
    methods.reset();
    onOpenChange?.(false);
  });

  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    if (product?._id && isEdit) {
      const doFetch = async () => {
        try {
          setIsLoadingProduct(true);
          const response = await fetch(`/api/products/${product._id}`, {
            signal: controller.signal,
          });
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
          if ((error as { name?: string }).name !== 'AbortError') {
            console.error('Error fetching product:', error);
          }
        } finally {
          setIsLoadingProduct(false);
        }
      };
      doFetch();
    }

    if (!isEdit && categories.length > 0) {
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

    return () => controller.abort();
  }, [open, product?._id, isEdit, categories.length, selectedCategoryId, methods]);

  const [unit, categoryId, addToCart] = methods.watch(['unit', 'categoryId', 'addToCart']);

  const isLoading = isLoadingCategories || isProductLoading.isLoading || isLoadingProduct;

  const quantityLabel = unit === UnitEnum.unit || !unit ? 'Qtd.' : 'Peso';

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
            'max-h-[90dvh]'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="min-h-0 flex-1 flex flex-col gap-4 overflow-y-auto px-5 pb-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  {isEdit ? 'Editar produto' : 'Novo produto'}
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  {isEdit
                    ? 'Ajuste só o necessário e salve.'
                    : 'Digite o nome agora; detalhes podem ficar para depois.'}
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => onOpenChange?.(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                aria-label="Carregando produto"
                className="flex h-40 items-center justify-center"
              >
                <span className="text-sm text-muted-foreground" aria-hidden="true">
                  Carregando...
                </span>
              </div>
            ) : (
              <FormProvider {...methods}>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-[7px]">
                    <span className="text-[13px] font-bold leading-[1.35] text-foreground">
                      Produto
                    </span>
                    <Input
                      required
                      type="text"
                      placeholder="Nome do produto"
                      className="h-10 rounded-lg px-3.5 text-base font-semibold"
                      {...methods.register('name')}
                    />
                  </div>

                  <CategoryPopover
                    value={categoryId}
                    categories={categories}
                    onChange={(id) =>
                      methods.setValue('categoryId', id, { shouldValidate: true })
                    }
                  />

                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-[750] leading-[1.35] text-foreground">
                        Detalhes opcionais
                      </span>
                      <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
                        pode preencher depois
                      </span>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="flex flex-1 flex-col gap-[7px]">
                        <span className="text-[13px] font-bold leading-[1.35] text-foreground">
                          Preço
                        </span>
                        <CurrencyInput
                          label=""
                          placeholder="R$ 0,00"
                          value={methods.watch('price')}
                          onValueChange={(value) => methods.setValue('price', value)}
                        />
                      </div>
                      <div className="flex flex-col gap-[7px]" style={{ width: 102 }}>
                        <span className="text-[13px] font-bold leading-[1.35] text-foreground">
                          {quantityLabel}
                        </span>
                        <Input
                          min={0}
                          step={0.1}
                          type="number"
                          placeholder={quantityLabel}
                          className="h-10 rounded-lg px-3.5"
                          {...methods.register('quantity')}
                        />
                      </div>
                    </div>

                    <UnitSegmentedControl
                      value={(unit as UnitEnum) || UnitEnum.unit}
                      onChange={(val) => methods.setValue('unit', val)}
                    />
                  </div>

                  <CartToggleRow
                    checked={!!addToCart}
                    onCheckedChange={(val) => methods.setValue('addToCart', val)}
                  />

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
                    >
                      {isEdit ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      {isEdit ? 'Salvar alterações' : 'Adicionar produto'}
                    </button>

                    <p className="text-[13px] font-medium leading-[1.4] text-[#898989]">
                      {isEdit
                        ? 'As alterações atualizam esta lista imediatamente.'
                        : 'Enter também salva quando o nome estiver preenchido.'}
                    </p>
                  </div>
                </form>
              </FormProvider>
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};
