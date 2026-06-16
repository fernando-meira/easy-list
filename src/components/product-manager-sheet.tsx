'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Check } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { ProductProps } from '@/types/interfaces';
import { useProducts } from '@/context/ProductContext';
import { CartToggleRow } from '@/components/ui/cart-toggle-row';
import { UnitEnum, AddOrEditProductTypeEnum } from '@/types/enums';
import { UnitSegmentedControl } from '@/components/ui/unit-segmented-control';

import { CurrencyInput } from './currency-input';
import { CategoryPopover } from './category-popover';
import { ResponsiveProductDialog } from './responsive-product-dialog';

interface ProductManagerSheetProps {
  open?: boolean;
  product?: ProductProps;
  type?: AddOrEditProductTypeEnum;
  initialProduct?: Partial<ProductProps>;
  onOpenChange?: (open: boolean) => void;
}

export const ProductManagerSheet = ({
  open,
  type,
  product,
  onOpenChange,
  initialProduct,
}: ProductManagerSheetProps) => {
  const { managerProduct, isProductLoading } = useProducts();
  const { categories, selectedCategoryId, isLoadingCategories } = useCategories();

  const isEdit = type === AddOrEditProductTypeEnum.edit;
  const formId = React.useId();

  const methods = useForm<Omit<ProductProps, 'category'> & { categoryId: string }>({
    defaultValues: {
      name: '',
      price: '',
      quantity: '',
      subcategory: '',
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

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      await managerProduct({ product: { ...data, categoryId: data.categoryId } });
      methods.reset();
      onOpenChange?.(false);
    } catch {
      // erro já tratado em managerProduct via toast e setError
    }
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
            barcode: data.barcode,
            quantity: data.quantity,
            addToCart: data.addToCart,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            subcategory: data.subcategory,
            categoryId: selectedCategoryId || data.category?._id,
          });
        } catch (error) {
          if ((error as { name?: string }).name !== 'AbortError') {
            toast.error('Não foi possível carregar o produto. Tente novamente.');
            onOpenChange?.(false);
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
          barcode: initialProduct?.barcode,
          name: initialProduct?.name ?? '',
          price: initialProduct?.price ?? '',
          quantity: initialProduct?.quantity ?? '1',
          unit: initialProduct?.unit ?? UnitEnum.unit,
          addToCart: initialProduct?.addToCart ?? false,
          categoryId: initialProduct?.categoryId ?? selectedCategoryId,
        },
        { keepDefaultValues: true }
      );
    }

    return () => controller.abort();
  // categories.length and methods intentionally omitted: including them
  // would reset the form whenever categories finish loading or methods
  // re-renders, which breaks the open-modal editing experience.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    isEdit,
    product?._id,
    onOpenChange,
    selectedCategoryId,
    initialProduct?.unit,
    initialProduct?.name,
    initialProduct?.price,
    initialProduct?.barcode,
    initialProduct?.quantity,
    initialProduct?.addToCart,
    initialProduct?.categoryId,
  ]);

  const [unit, categoryId, addToCart] = methods.watch(['unit', 'categoryId', 'addToCart']);

  const isLoading = isLoadingCategories || isProductLoading.isLoading || isLoadingProduct;

  const quantityLabel = unit === UnitEnum.unit || !unit ? 'Qtd.' : 'Peso';
  const title = isEdit ? 'Editar produto' : 'Novo produto';
  const description = isEdit
    ? 'Ajuste só o necessário e salve.'
    : 'Digite o nome agora; detalhes podem ficar para depois.';

  return (
    <ResponsiveProductDialog
      open={open}
      title={title}
      description={description}
      onOpenChange={onOpenChange}
      footer={
        !isLoading ? (
          <div className="flex flex-col gap-2.5">
            <button
              form={formId}
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
        ) : null
      }
    >
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
          <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
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
                    inputMode="decimal"
                    placeholder={quantityLabel}
                    className="h-10 rounded-lg px-3.5 text-base"
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

            <CategoryPopover
              value={categoryId}
              categories={categories}
              onChange={(id) =>
                methods.setValue('categoryId', id, { shouldValidate: true })
              }
            />

            {categories.find(c => c._id === categoryId)?.subcategoryOrder && (
              <div className="flex flex-col gap-[7px]">
                <span className="text-[13px] font-bold leading-[1.35] text-foreground">
                  Seção
                </span>
                <select
                  className="h-10 rounded-lg border border-input bg-background px-3.5 text-base font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...methods.register('subcategory')}
                >
                  {categories.find(c => c._id === categoryId)!.subcategoryOrder!.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option key="" value="">Outros</option>
                </select>
              </div>
            )}
          </form>
        </FormProvider>
      )}
    </ResponsiveProductDialog>
  );
};
