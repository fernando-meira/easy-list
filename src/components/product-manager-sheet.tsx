'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { ProductProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/context/ProductContext';
import { CartToggleRow } from '@/components/ui/cart-toggle-row';
import { UnitEnum, AddOrEditProductTypeEnum } from '@/types/enums';
import { UnitSegmentedControl } from '@/components/ui/unit-segmented-control';

import { SelectField } from './select-field';
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
  const { managerProduct } = useProducts();
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

  const [unit, addToCart, categoryId, subcategory] = methods.watch([
    'unit',
    'addToCart',
    'categoryId',
    'subcategory',
  ]);

  const { errors, isSubmitting } = methods.formState;

  const isInitialLoading = isLoadingCategories || isLoadingProduct;

  const selectedCategory = categories.find((category) => category._id === categoryId);
  const subcategoryOptions = selectedCategory?.subcategoryOrder;

  const quantityLabel = unit === UnitEnum.unit || !unit ? 'Qtd.' : 'Peso';
  const title = isEdit ? 'Editar produto' : 'Novo produto';
  const description = isEdit
    ? 'Ajuste só o necessário e salve.'
    : 'Digite o nome agora; detalhes podem ficar para depois.';

  const submitLabel = isSubmitting
    ? 'Salvando...'
    : isEdit
      ? 'Salvar alterações'
      : 'Adicionar produto';

  return (
    <ResponsiveProductDialog
      open={open}
      title={title}
      description={description}
      onOpenChange={onOpenChange}
      footer={
        isInitialLoading ? (
          <Skeleton className="h-10 w-full rounded-lg" />
        ) : (
          <div className="flex flex-col gap-2.5">
            <button
              form={formId}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : isEdit ? (
                <Check className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Plus className="h-5 w-5" aria-hidden="true" />
              )}
              {submitLabel}
            </button>

            <p className="text-[13px] font-medium leading-[1.4] text-muted-foreground">
              {isEdit
                ? 'As alterações atualizam esta lista imediatamente.'
                : 'Enter também salva quando o nome estiver preenchido.'}
            </p>
          </div>
        )
      }
    >
      {isInitialLoading ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-5">
          <span className="sr-only">Carregando produto</span>
          <div className="flex flex-col gap-[7px]" aria-hidden="true">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-3.5 w-full" />
            <div className="flex gap-2.5">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" style={{ width: 102 }} />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <FormProvider {...methods}>
          <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-[7px]">
              <label
                htmlFor={`${formId}-name`}
                className="text-[13px] font-bold leading-[1.35] text-foreground"
              >
                Produto
              </label>
              <Input
                id={`${formId}-name`}
                type="text"
                placeholder="Nome do produto"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? `${formId}-name-error` : undefined}
                className={cn(
                  'h-11 rounded-lg px-3.5 text-base font-semibold',
                  errors.name &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                {...methods.register('name', {
                  required: 'Informe o nome do produto.',
                })}
              />
              {errors.name ? (
                <span
                  role="alert"
                  id={`${formId}-name-error`}
                  className="text-[13px] font-medium leading-[1.4] text-destructive"
                >
                  {errors.name.message}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold leading-[1.35] text-foreground">
                  Detalhes opcionais
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>

              <div className="flex gap-2.5">
                <div className="flex flex-1 flex-col gap-[7px]">
                  <label
                    htmlFor={`${formId}-price`}
                    className="text-[13px] font-bold leading-[1.35] text-foreground"
                  >
                    Preço
                  </label>
                  <CurrencyInput
                    label=""
                    id={`${formId}-price`}
                    placeholder="R$ 0,00"
                    value={methods.watch('price')}
                    onValueChange={(value) => methods.setValue('price', value)}
                  />
                </div>
                <div className="flex flex-col gap-[7px]" style={{ width: 102 }}>
                  <label
                    htmlFor={`${formId}-quantity`}
                    className="text-[13px] font-bold leading-[1.35] text-foreground"
                  >
                    {quantityLabel}
                  </label>
                  <Input
                    min={0}
                    step={0.1}
                    type="number"
                    inputMode="decimal"
                    id={`${formId}-quantity`}
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

            <div className="flex flex-col gap-3">
              <CartToggleRow
                checked={!!addToCart}
                onCheckedChange={(val) => methods.setValue('addToCart', val)}
              />

              {isEdit ? (
                <CategoryPopover
                  value={categoryId}
                  categories={categories}
                  onChange={(id) =>
                    methods.setValue('categoryId', id, { shouldValidate: true })
                  }
                />
              ) : null}

              {subcategoryOptions && subcategoryOptions.length > 0 ? (
                <SelectField
                  label="Seção"
                  value={subcategory ?? ''}
                  onChange={(val) => methods.setValue('subcategory', val)}
                  options={[
                    ...subcategoryOptions.map((sub) => ({ value: sub, label: sub })),
                    { value: '', label: 'Outros' },
                  ]}
                  getAriaLabel={(selected) =>
                    selected
                      ? `Seção selecionada: ${selected.label}. Clique para trocar.`
                      : 'Selecionar seção'
                  }
                />
              ) : null}
            </div>
          </form>
        </FormProvider>
      )}
    </ResponsiveProductDialog>
  );
};
