# 🔄 Guia de Migração: Context API → React Query

Este guia mostra como migrar gradualmente do Context API para React Query com polling inteligente.

## 📋 Estratégia de Migração

Você pode migrar **gradualmente** sem quebrar a aplicação existente. Ambas as abordagens podem coexistir.

---

## Passo 1: Adicionar QueryProvider

Edite `src/app/layout.tsx`:

```tsx
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={manrope.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {/* ✅ Adicione o QueryProvider aqui */}
            <QueryProvider>
              <UserContextProvider>
                <CategoriesContextProvider>
                  <ProductsContextProvider>
                    <Toaster />
                    {children}
                  </ProductsContextProvider>
                </CategoriesContextProvider>
              </UserContextProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Passo 2: Criar Versão Híbrida do CategoryContext (Opcional)

Se você quiser manter compatibilidade com código existente, crie uma versão híbrida:

```tsx
// src/context/CategoryContext.tsx
'use client';

import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { createContext, useContext, useState } from 'react';
import { CategoryProps } from '@/types/interfaces';

interface CategoriesContextType {
  categories: CategoryProps[];
  selectedCategoryId?: string;
  isLoadingCategories: boolean;
  errorCategories: string | null;
  filteredCategory?: CategoryProps;
  setSelectedCategoryId: (categoryId: string) => void;
  // Métodos do React Query
  addCategory: (category: CategoryProps) => void;
  removeCategory: (id: string) => void;
}

export const CategoriesContext = createContext({} as CategoriesContextType);

function CategoriesContextProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [filteredCategory, setFilteredCategory] = useState<CategoryProps | undefined>(undefined);

  // ✅ Usa React Query internamente
  const {
    categories,
    isLoading: isLoadingCategories,
    error,
    addCategory,
    removeCategory,
  } = useCategoriesQuery();

  // Mantém a lógica de filtro existente
  const filterCategory = (categoryId: string) => {
    if (!categoryId || categoryId === 'all') {
      setFilteredCategory(undefined);
      return;
    }
    const filtered = categories.find(cat => cat._id === categoryId);
    setFilteredCategory(filtered);
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        selectedCategoryId,
        isLoadingCategories,
        errorCategories: error,
        filteredCategory,
        setSelectedCategoryId,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

function useCategories(): CategoriesContextType {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}

export { useCategories, CategoriesContextProvider };
```

**Vantagem**: Código existente continua funcionando sem alterações!

---

## Passo 3: Migrar Componentes Gradualmente

### Opção A: Usar Context Híbrido (Sem Mudanças)

Se você implementou o Context híbrido acima, **nenhum componente precisa mudar**:

```tsx
// Continua funcionando exatamente como antes!
import { useCategories } from '@/context/CategoryContext';

function MyComponent() {
  const { categories, isLoadingCategories } = useCategories();
  // ... resto do código
}
```

### Opção B: Migrar Diretamente para React Query

```tsx
// ANTES
import { useCategories } from '@/context/CategoryContext';

function MyComponent() {
  const { categories, isLoadingCategories, addCategory } = useCategories();
  // ...
}

// DEPOIS
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';

function MyComponent() {
  const { categories, isLoading, addCategory } = useCategoriesQuery();
  // ...
}
```

---

## Passo 4: Atualizar ProductContext (Opcional)

Você pode criar um hook similar para produtos:

```tsx
// src/hooks/useProductsQuery.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductProps } from '@/types/interfaces';
import { toast } from 'sonner';

export function useProductsQuery(categoryId: string) {
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
  } = useQuery<ProductProps[]>({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/products?categoryId=${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    enabled: !!categoryId,
  });

  const toggleCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const product = products.find(p => p._id === productId);
      if (!product) throw new Error('Product not found');

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, addToCart: !product.addToCart }),
      });

      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Produto atualizado');
    },
  });

  return {
    products,
    isLoading,
    toggleCart: toggleCartMutation.mutate,
  };
}
```

---

## Passo 5: Testar Sincronização

1. Abra a aplicação em **duas abas** diferentes
2. Faça login com o mesmo usuário
3. Adicione um produto na **Aba 1**
4. Observe o produto aparecer na **Aba 2** em até 3 segundos

---

## 🎯 Comparação: Antes vs Depois

### ANTES (Context API)

```tsx
// ❌ Sem sincronização automática
// ❌ Dados só atualizam ao recarregar
// ❌ Múltiplas chamadas de API desnecessárias
// ❌ Estado global complexo

const { categories, fetchCategories } = useCategories();

useEffect(() => {
  fetchCategories(); // Manual
}, []);
```

### DEPOIS (React Query)

```tsx
// ✅ Sincronização automática a cada 3s
// ✅ Atualiza ao retornar o foco
// ✅ Cache inteligente
// ✅ Estado gerenciado automaticamente

const { categories } = useCategoriesQuery();
// Pronto! Sem useEffect, sem fetchCategories manual
```

---

## 📊 Exemplo Completo: Página de Categoria

```tsx
'use client';

import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { ProductsList } from '@/components/product-list';
import { ProductManagerDrawer } from '@/components/product-manager-drawer';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { useState } from 'react';

export default function CategoryPage() {
  const {
    categories,
    isLoading,
    error,
    dataUpdatedAt,
  } = useCategoriesQuery();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Erro: {error}</p>
      </div>
    );
  }

  const selectedCategory = categories.find(cat => cat._id === selectedCategoryId);

  // ✅ Total recalculado automaticamente quando dados mudam
  const total = (selectedCategory?.products || [])
    .filter(p => p.addToCart)
    .reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const quantity = Number(p.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Minhas Listas</h1>

        {/* Indicador de sincronização */}
        <small className="text-muted-foreground">
          Última atualização: {new Date(dataUpdatedAt).toLocaleTimeString()}
        </small>
      </div>

      {/* Seletor de Categoria */}
      <select
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value)}
        className="mb-4 p-2 border rounded"
      >
        <option value="">Selecione uma categoria</option>
        {categories.map(cat => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>

      {selectedCategory && (
        <>
          {/* Lista de Produtos */}
          <ProductsList category={selectedCategory} />

          {/* Total */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
            <div className="container mx-auto flex justify-between items-center">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-2xl font-bold text-primary">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botão Adicionar Produto */}
          <ProductManagerDrawer type={AddOrEditProductTypeEnum.add} />
        </>
      )}
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### "Cannot find module '@tanstack/react-query'"

Execute:
```bash
npm install @tanstack/react-query
```

### Polling não funciona

1. Verifique se `QueryProvider` está no layout
2. Confirme que o usuário está autenticado
3. Abra o DevTools → Network e veja se as requisições estão sendo feitas

### Muitas requisições

Aumente o intervalo:
```tsx
refetchInterval: 5000 // 5 segundos
```

---

## ✅ Checklist

- [ ] Instalar `@tanstack/react-query`
- [ ] Adicionar `QueryProvider` no `layout.tsx`
- [ ] Criar `useCategoriesQuery` hook
- [ ] (Opcional) Criar Context híbrido para compatibilidade
- [ ] Testar em duas abas diferentes
- [ ] Verificar se o total atualiza automaticamente
- [ ] Ajustar intervalo de polling se necessário

---

## 🎉 Resultado

Agora sua aplicação tem:

- ✅ Sincronização automática entre usuários
- ✅ Atualização ao retornar o foco
- ✅ Cache inteligente
- ✅ Menos código boilerplate
- ✅ Melhor performance
- ✅ Experiência "tempo real leve"

**Sem precisar de WebSockets!** 🚀
