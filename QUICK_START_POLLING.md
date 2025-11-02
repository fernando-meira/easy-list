# ⚡ Quick Start: Sincronização Automática com Polling

Guia rápido para implementar sincronização automática no EasyList em **5 minutos**.

---

## 📦 Passo 1: Instalar React Query

```bash
npm install @tanstack/react-query
```

---

## 🔧 Passo 2: Adicionar QueryProvider

Edite `src/app/layout.tsx` e adicione o `QueryProvider`:

```tsx
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>  {/* ✅ Adicione aqui */}
              <UserContextProvider>
                <CategoriesContextProvider>
                  <ProductsContextProvider>
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

## 🎯 Passo 3: Usar o Hook

Em qualquer componente que precise de dados sincronizados:

```tsx
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';

export function MyComponent() {
  const { categories, isLoading } = useCategoriesQuery();

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {categories.map(cat => (
        <div key={cat._id}>{cat.name}</div>
      ))}
    </div>
  );
}
```

**Pronto!** Agora os dados atualizam automaticamente a cada 3 segundos. ✅

---

## 🧪 Passo 4: Testar

1. Abra a aplicação em **duas abas** do navegador
2. Faça login com o mesmo usuário
3. Adicione um produto na **Aba 1**
4. Veja o produto aparecer na **Aba 2** em até **3 segundos**

---

## 📊 Exemplo: Calcular Total Automaticamente

```tsx
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { useMemo } from 'react';

export function ShoppingCart() {
  const { categories } = useCategoriesQuery();

  // ✅ Total recalculado automaticamente quando dados mudam
  const total = useMemo(() => {
    return categories
      .flatMap(cat => cat.products || [])
      .filter(p => p.addToCart)
      .reduce((sum, p) => {
        const price = Number(p.price) || 0;
        const quantity = Number(p.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
  }, [categories]);

  return (
    <div>
      <h2>Total: R$ {total.toFixed(2)}</h2>
    </div>
  );
}
```

---

## ⚙️ Ajustar Intervalo de Polling

Edite `src/hooks/useCategoriesQuery.ts`:

```typescript
// Linha 38
refetchInterval: 5000, // Mude de 3000 para 5000 (5 segundos)
```

---

## 📁 Arquivos Criados

Verifique se estes arquivos foram criados:

- ✅ `src/providers/query-provider.tsx` - Provider do React Query
- ✅ `src/hooks/useCategoriesQuery.ts` - Hook com polling inteligente
- ✅ `src/components/category-page-example.tsx` - Exemplo de uso
- ✅ `POLLING_SETUP.md` - Documentação completa
- ✅ `MIGRATION_GUIDE.md` - Guia de migração

---

## 🎨 Exemplo Completo: Página com Total

```tsx
'use client';

import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { useMemo } from 'react';

export default function CategoryPage() {
  const {
    categories,
    isLoading,
    dataUpdatedAt, // Timestamp da última atualização
  } = useCategoriesQuery();

  const total = useMemo(() => {
    return categories
      .flatMap(cat => cat.products || [])
      .filter(p => p.addToCart)
      .reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
  }, [categories]);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Minhas Listas</h1>

      {/* Indicador de sincronização */}
      <small>
        Última atualização: {new Date(dataUpdatedAt).toLocaleTimeString()}
      </small>

      {/* Lista de categorias */}
      {categories.map(cat => (
        <div key={cat._id}>
          <h2>{cat.name}</h2>
          {/* Renderize produtos aqui */}
        </div>
      ))}

      {/* Total atualizado automaticamente */}
      <footer>
        <strong>Total: R$ {total.toFixed(2)}</strong>
      </footer>
    </div>
  );
}
```

---

## ✅ Checklist

- [ ] Executar `npm install @tanstack/react-query`
- [ ] Adicionar `QueryProvider` no `layout.tsx`
- [ ] Importar `useCategoriesQuery` nos componentes
- [ ] Testar em duas abas diferentes
- [ ] Verificar se o total atualiza automaticamente

---

## 🔍 Verificar se Está Funcionando

1. **Abra o DevTools** (F12)
2. Vá na aba **Network**
3. Filtre por `categories`
4. Você deve ver requisições sendo feitas a cada 3 segundos

---

## 🚀 Próximos Passos

Depois de implementar o básico, explore:

1. **Polling Condicional** - Pausar quando usuário inativo
2. **Optimistic Updates** - Atualizar UI antes da resposta do servidor
3. **React Query DevTools** - Visualizar cache e queries
4. **Infinite Queries** - Paginação infinita

Veja `POLLING_SETUP.md` para detalhes.

---

## 🆘 Problemas?

### Erro: "Cannot find module '@tanstack/react-query'"

```bash
npm install @tanstack/react-query
```

### Polling não funciona

1. Verifique se `QueryProvider` está no layout
2. Confirme que o usuário está autenticado
3. Veja o console para erros

### Muitas requisições

Aumente o intervalo em `useCategoriesQuery.ts`:
```typescript
refetchInterval: 10000 // 10 segundos
```

---

## 📚 Documentação Completa

- **POLLING_SETUP.md** - Documentação detalhada
- **MIGRATION_GUIDE.md** - Como migrar do Context API
- **category-page-example.tsx** - Exemplo completo de componente

---

## 🎉 Resultado

Agora você tem:

- ✅ Sincronização automática entre usuários
- ✅ Total recalculado automaticamente
- ✅ Atualização ao retornar o foco
- ✅ Cache inteligente
- ✅ Experiência "tempo real leve"

**Sem WebSockets!** 🚀
