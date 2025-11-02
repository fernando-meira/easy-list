'use client';

/**
 * EXEMPLO DE COMPONENTE COM POLLING INTELIGENTE
 *
 * Este componente demonstra como usar o hook useCategoriesQuery
 * para ter sincronização automática de dados.
 *
 * Funcionalidades:
 * - Atualização automática a cada 3 segundos
 * - Revalidação ao retornar o foco para a aba
 * - Total recalculado automaticamente
 * - Indicador de última atualização
 */

import { useMemo, useState } from 'react';
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { ProductsList } from '@/components/product-list';
import { ProductManagerDrawer } from '@/components/product-manager-drawer';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';

export function CategoryPageExample() {
  const {
    categories,
    isLoading,
    error,
    dataUpdatedAt, // Timestamp da última atualização
  } = useCategoriesQuery();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [openEditSheet, setOpenEditSheet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps>({} as ProductProps);

  // Categoria selecionada
  const selectedCategory = useMemo(
    () => categories.find(cat => cat._id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  // ✅ TOTAL RECALCULADO AUTOMATICAMENTE
  // Sempre que os dados mudam (polling), este valor é recalculado
  const total = useMemo(() => {
    if (!selectedCategory?.products) return 0;

    return selectedCategory.products
      .filter(product => product.addToCart)
      .reduce((sum, product) => {
        const price = Number(product.price) || 0;
        const quantity = Number(product.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
  }, [selectedCategory]);

  // Produtos no carrinho
  const productsInCart = useMemo(() => {
    if (!selectedCategory?.products) return 0;
    return selectedCategory.products.filter(p => p.addToCart).length;
  }, [selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando suas listas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-2">Erro ao carregar dados</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      {/* Header com indicador de sincronização */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Minhas Listas</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
          </p>
        </div>

        {/* ✅ Indicador de última atualização */}
        <div className="text-right">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Sincronizado</span>
          </div>
          <small className="text-xs text-muted-foreground">
            {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR')}
          </small>
        </div>
      </div>

      {/* Seletor de Categoria */}
      <div className="mb-6">
        <label htmlFor="category-select" className="block text-sm font-medium mb-2">
          Selecione uma categoria
        </label>
        <select
          id="category-select"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="w-full p-3 border rounded-lg bg-background"
        >
          <option value="">-- Escolha uma categoria --</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name} ({cat.products?.length || 0} produtos)
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Produtos */}
      {selectedCategory && (
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-card p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
              <p className="text-2xl font-bold">{selectedCategory.products?.length || 0}</p>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">No Carrinho</p>
              <p className="text-2xl font-bold">{productsInCart}</p>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <ProductsList
            category={selectedCategory}
            setSelectedProducts={setSelectedProduct}
            setOpenEditSheet={setOpenEditSheet}
          />
        </div>
      )}

      {/* Rodapé Fixo com Total */}
      {selectedCategory && productsInCart > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  {productsInCart} {productsInCart === 1 ? 'item' : 'itens'} no carrinho
                </p>
                <p className="text-xs text-muted-foreground">
                  ✅ Atualizado automaticamente
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                {/* ✅ TOTAL ATUALIZADO AUTOMATICAMENTE */}
                <p className="text-3xl font-bold text-primary">
                  R$ {total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer para Adicionar/Editar Produto */}
      <ProductManagerDrawer
        type={AddOrEditProductTypeEnum.add}
      />

      {selectedProduct && (
        <ProductManagerDrawer
          open={openEditSheet}
          onOpenChange={setOpenEditSheet}
          type={AddOrEditProductTypeEnum.edit}
          product={selectedProduct}
        />
      )}
    </div>
  );
}

/**
 * COMO FUNCIONA A SINCRONIZAÇÃO:
 *
 * 1. O hook useCategoriesQuery faz polling a cada 3 segundos
 * 2. Quando detecta mudanças, atualiza o estado automaticamente
 * 3. Os useMemo recalculam os valores derivados (total, productsInCart)
 * 4. O componente re-renderiza com os novos dados
 *
 * TESTE:
 * 1. Abra a aplicação em duas abas
 * 2. Adicione um produto na Aba 1
 * 3. Veja o produto aparecer na Aba 2 em até 3 segundos
 * 4. Observe o total sendo recalculado automaticamente
 */
