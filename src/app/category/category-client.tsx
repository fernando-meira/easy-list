'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import { ProductProps } from '@/types/interfaces';
import { StateCard } from '@/components/state-card';
import { ProductRow } from '@/components/product-row';
import { useProducts, useCategories } from '@/context';
import { GroupHeader } from '@/components/group-header';
import { StickyFooter } from '@/components/sticky-footer';
import { CategoryHeroCard } from '@/components/category-hero-card';
import { UnitEnum, AddOrEditProductTypeEnum } from '@/types/enums';
import { BarcodeScannerSheet } from '@/components/barcode-scanner-sheet';
import { ProductManagerSheet } from '@/components/product-manager-sheet';
import { CategoryPageSkeleton } from '@/components/category-page-skeleton';
import { BarcodeLookupResult, BarcodeProductPreview } from '@/components/barcode-product-preview';

export function CategoryClient() {
  const searchParams = useSearchParams();
  const { setSelectedCategoryId, filteredCategory, isLoadingCategories } = useCategories();
  const { removeProduct, toggleCart, managerProduct, isProductLoading } = useProducts();

  const categoryId = searchParams.get('id');

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps>({} as ProductProps);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lookupResult, setLookupResult] = useState<BarcodeLookupResult | null>(null);
  const [scannerInitialProduct, setScannerInitialProduct] = useState<Partial<ProductProps> | undefined>();
  const [isBarcodeBusy, setIsBarcodeBusy] = useState(false);

  useEffect(() => {
    if (!categoryId) return;
    setSelectedCategoryId(categoryId);
  }, [categoryId, setSelectedCategoryId]);

  const handleEditProduct = (product: ProductProps) => {
    setSelectedProduct(product);
    setEditSheetOpen(true);
  };

  const buildProductFromLookup = (result: BarcodeLookupResult): Partial<ProductProps> => ({
    name: result.name ?? '',
    barcode: result.barcode,
    categoryId: filteredCategory?._id,
    quantity: '1',
    unit: UnitEnum.unit,
    addToCart: false,
  });

  const findDuplicateProduct = (barcode?: string) => {
    if (!barcode) return undefined;

    return (filteredCategory?.products ?? []).find(product => product.barcode === barcode);
  };

  const openManualProductForm = (initialProduct: Partial<ProductProps>) => {
    setScannerInitialProduct(initialProduct);
    setPreviewOpen(false);
    setScannerOpen(false);
    setAddSheetOpen(true);
  };

  const buildFallbackProduct = (barcode: string): Partial<ProductProps> => ({
    barcode,
    categoryId: filteredCategory?._id,
    quantity: '1',
    unit: UnitEnum.unit,
  });

  const handleBarcodeDetected = async (code: string) => {
    setIsBarcodeBusy(true);

    try {
      const response = await fetch(`/api/barcode/${encodeURIComponent(code)}`);

      if (!response.ok) {
        toast.error('Não foi possível consultar o produto. Cadastre manualmente.');
        openManualProductForm(buildFallbackProduct(code));
        return;
      }

      const result = await response.json() as BarcodeLookupResult;

      if (!result.found || !result.name) {
        toast('Produto não encontrado. Cadastre manualmente.');
        openManualProductForm(buildFallbackProduct(result.barcode || code));
        return;
      }

      setLookupResult(result);
      setScannerOpen(false);
      setPreviewOpen(true);
    } catch {
      toast.error('Erro ao consultar o código de barras. Cadastre manualmente.');
      openManualProductForm(buildFallbackProduct(code));
    } finally {
      setIsBarcodeBusy(false);
    }
  };

  const handleAddLookupProduct = async () => {
    if (!lookupResult || !filteredCategory?._id || !lookupResult.name) return;

    setIsBarcodeBusy(true);

    try {
      await managerProduct({
        product: {
          name: lookupResult.name,
          barcode: lookupResult.barcode,
          categoryId: filteredCategory._id,
          quantity: '1',
          unit: UnitEnum.unit,
          addToCart: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      setPreviewOpen(false);
      setLookupResult(null);
    } finally {
      setIsBarcodeBusy(false);
    }
  };

  const handleEditLookupProduct = () => {
    if (!lookupResult) return;

    openManualProductForm(buildProductFromLookup(lookupResult));
  };

  const handleEditDuplicateProduct = () => {
    const duplicate = findDuplicateProduct(lookupResult?.barcode);

    if (!duplicate) return;

    setSelectedProduct(duplicate);
    setPreviewOpen(false);
    setEditSheetOpen(true);
  };

  const { productsNotInCart, productsInCart } = useMemo(() => {
    const all = filteredCategory?.products ?? [];
    const sorted = [...all].sort((a, b) =>
      (a.name ?? '').toLowerCase().localeCompare(
        (b.name ?? '').toLowerCase(),
        'pt-BR'
      )
    );
    return {
      productsNotInCart: sorted.filter(p => !p.addToCart),
      productsInCart: sorted.filter(p => p.addToCart),
    };
  }, [filteredCategory?.products]);

  if (isLoadingCategories && !filteredCategory) {
    return <CategoryPageSkeleton />;
  }

  if (!filteredCategory) {
    return <StateCard variant="error" />;
  }

  const allProducts = filteredCategory.products ?? [];

  return (
    <>
      <div className="flex flex-col gap-4 pb-[140px]">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5">
          <Link href="/" className="text-[12px] font-semibold text-[var(--color-ink)]">
            Home
          </Link>
          <span className="text-[12px] text-[var(--color-muted)]">/</span>
          <span className="text-[12px] font-semibold text-[var(--color-muted)]" aria-current="page">
            {filteredCategory.name}
          </span>
        </nav>

        <CategoryHeroCard
          category={filteredCategory}
          products={allProducts}
        />

        {allProducts.length === 0 && (
          <StateCard variant="empty" onAdd={() => setAddSheetOpen(true)} />
        )}

        {productsNotInCart.length > 0 && (
          <>
            <GroupHeader
              title="Fora do carrinho"
              count={productsNotInCart.length}
            />
            {productsNotInCart.map(p => (
              <ProductRow
                key={p._id}
                product={p}
                variant="pending"
                onToggleCart={toggleCart}
                onEdit={handleEditProduct}
                onDelete={removeProduct}
                isProductLoading={isProductLoading}
              />
            ))}
          </>
        )}

        {productsInCart.length > 0 && (
          <>
            <GroupHeader
              title="Carrinho"
              count={productsInCart.length}
            />
            {productsInCart.map(p => (
              <ProductRow
                key={p._id}
                product={p}
                variant="cart"
                onToggleCart={toggleCart}
                onEdit={handleEditProduct}
                onDelete={removeProduct}
                isProductLoading={isProductLoading}
              />
            ))}
          </>
        )}
      </div>

      <StickyFooter
        products={allProducts}
        onAddProduct={() => {
          setScannerInitialProduct(undefined);
          setAddSheetOpen(true);
        }}
        onScanProduct={() => setScannerOpen(true)}
      />

      <ProductManagerSheet
        open={addSheetOpen}
        initialProduct={scannerInitialProduct}
        onOpenChange={setAddSheetOpen}
        type={AddOrEditProductTypeEnum.add}
      />

      <ProductManagerSheet
        open={editSheetOpen}
        product={selectedProduct}
        onOpenChange={setEditSheetOpen}
        type={AddOrEditProductTypeEnum.edit}
      />

      <BarcodeScannerSheet
        open={scannerOpen}
        isBusy={isBarcodeBusy}
        onDetected={handleBarcodeDetected}
        onOpenChange={setScannerOpen}
      />

      <BarcodeProductPreview
        open={previewOpen}
        result={lookupResult}
        duplicateName={findDuplicateProduct(lookupResult?.barcode)?.name}
        isCreating={isBarcodeBusy}
        onAdd={handleAddLookupProduct}
        onEdit={handleEditLookupProduct}
        onEditDuplicate={handleEditDuplicateProduct}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}
