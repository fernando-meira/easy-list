# 🔄 Sincronização Automática com Polling Inteligente

Este documento explica como implementar a sincronização automática de dados no EasyList usando React Query com polling inteligente.

## 📋 Índice

1. [Instalação](#instalação)
2. [Configuração](#configuração)
3. [Como Funciona](#como-funciona)
4. [Exemplo de Uso](#exemplo-de-uso)
5. [Ajustes e Otimizações](#ajustes-e-otimizações)
6. [Backend - updatedAt](#backend---updatedat)

---

## 🚀 Instalação

```bash
npm install @tanstack/react-query
```

---

## ⚙️ Configuração

### 1. Adicionar QueryProvider no layout principal

Edite o arquivo `src/app/layout.tsx` (ou `_app.tsx` se estiver usando Pages Router):

```tsx
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          {/* Seus outros providers */}
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 2. Substituir Context por React Query Hook

**ANTES** (usando Context):
```tsx
import { useCategories } from '@/context/CategoryContext';

function MyComponent() {
  const { categories, isLoadingCategories } = useCategories();
  // ...
}
```

**DEPOIS** (usando React Query):
```tsx
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';

function MyComponent() {
  const { categories, isLoading } = useCategoriesQuery();
  // ...
}
```

---

## 🔍 Como Funciona

### Polling Inteligente

O hook `useCategoriesQuery` implementa as seguintes funcionalidades:

#### 1. **Polling Automático (3 segundos)**
```typescript
refetchInterval: 3000
```
- Busca novos dados a cada 3 segundos
- Mantém todos os usuários sincronizados
- Simula "tempo real leve"

#### 2. **Revalidação ao Retornar o Foco**
```typescript
refetchOnWindowFocus: true
```
- Quando o usuário volta para a aba, os dados são atualizados
- Garante que sempre veja informações recentes

#### 3. **Pausa Automática**
```typescript
enabled: sessionStatus === AuthStatusEnum.authenticated
```
- Polling só acontece se o usuário estiver autenticado
- Economiza recursos quando não necessário

#### 4. **Evita Re-renderizações Desnecessárias**
```typescript
placeholderData: (previousData) => previousData
```
- Mantém dados anteriores durante revalidação
- Evita "flicker" na UI

---

## 💻 Exemplo de Uso

### Componente de Lista de Produtos

```tsx
'use client';

import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { ProductsList } from '@/components/product-list';

export default function CategoryPage() {
  const {
    categories,
    isLoading,
    error,
    dataUpdatedAt, // Timestamp da última atualização
  } = useCategoriesQuery();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  // O total é recalculado automaticamente quando os dados mudam
  const total = categories
    .flatMap(cat => cat.products || [])
    .reduce((sum, product) => {
      if (product.addToCart && product.price && product.quantity) {
        return sum + (Number(product.price) * Number(product.quantity));
      }
      return sum;
    }, 0);

  return (
    <div>
      <h1>Minhas Listas</h1>
      <p>Total: R$ {total.toFixed(2)}</p>

      {categories.map(category => (
        <ProductsList key={category._id} category={category} />
      ))}

      {/* Indicador de última atualização (opcional) */}
      <small>
        Última atualização: {new Date(dataUpdatedAt).toLocaleTimeString()}
      </small>
    </div>
  );
}
```

### Adicionar/Editar Produtos

```tsx
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';

export function ProductForm() {
  const { addCategory, isAddingCategory } = useCategoriesQuery();

  const handleSubmit = (data) => {
    addCategory(data);
    // Após a mutation, os dados são automaticamente revalidados
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Seus campos */}
      <button disabled={isAddingCategory}>
        {isAddingCategory ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
```

---

## 🎛️ Ajustes e Otimizações

### 1. Alterar Intervalo de Polling

Edite `src/hooks/useCategoriesQuery.ts`:

```typescript
// Polling a cada 5 segundos
refetchInterval: 5000

// Polling a cada 10 segundos
refetchInterval: 10000
```

### 2. Polling Condicional (Pausar quando Inativo)

```typescript
refetchInterval: (query) => {
  // Pausa se não houver interação por 5 minutos
  const lastInteraction = Date.now() - query.state.dataUpdatedAt;
  return lastInteraction > 300000 ? false : 3000;
}
```

### 3. Polling Baseado em Visibilidade da Página

```typescript
import { useEffect, useState } from 'react';

function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// No hook useCategoriesQuery:
const isVisible = usePageVisibility();

useQuery({
  // ...
  refetchInterval: isVisible ? 3000 : false,
});
```

### 4. Desabilitar Polling Completamente

```typescript
refetchInterval: false
```

### 5. Polling Apenas em Horário Comercial

```typescript
refetchInterval: () => {
  const hour = new Date().getHours();
  // Polling das 8h às 18h
  return hour >= 8 && hour <= 18 ? 3000 : false;
}
```

### 6. Comparação de `updatedAt` para Otimizar

```typescript
useQuery({
  // ...
  select: (data) => {
    // Você pode adicionar lógica para comparar updatedAt
    // e evitar atualizações desnecessárias
    const sortedData = data.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return sortedData;
  },
});
```

---

## 🗄️ Backend - updatedAt

### Mongoose já inclui `updatedAt` automaticamente

Os modelos já estão configurados com `timestamps: true`:

```typescript
// src/models/Category.ts
const categorySchema = new mongoose.Schema({
  name: String,
  userId: String,
}, {
  timestamps: true, // ✅ Cria createdAt e updatedAt automaticamente
});

// src/models/Product.ts
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  // ...
}, {
  timestamps: true, // ✅ Cria createdAt e updatedAt automaticamente
});
```

### API já retorna `updatedAt`

A API em `src/app/api/categories/route.ts` já retorna os campos automaticamente:

```typescript
export async function GET(request: NextRequest) {
  // ...
  const categories = await Category.find({ userId: token.sub });

  // Cada categoria terá:
  // - _id
  // - name
  // - userId
  // - createdAt  ✅
  // - updatedAt  ✅

  return NextResponse.json(categories);
}
```

### Exemplo de Resposta da API

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Supermercado",
    "userId": "user123",
    "createdAt": "2024-11-02T18:30:00.000Z",
    "updatedAt": "2024-11-02T19:15:00.000Z",
    "products": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Arroz",
        "price": 25.90,
        "quantity": 2,
        "unit": "kg",
        "addToCart": true,
        "createdAt": "2024-11-02T18:30:00.000Z",
        "updatedAt": "2024-11-02T19:15:00.000Z"
      }
    ]
  }
]
```

### Otimização: Retornar Apenas se Houver Mudanças

Se quiser otimizar ainda mais, você pode implementar um endpoint que verifica `updatedAt`:

```typescript
// src/app/api/categories/check-updates/route.ts
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const lastUpdate = url.searchParams.get('lastUpdate');

  const token = await getToken({ req: request });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Busca apenas se houver atualizações após lastUpdate
  const hasUpdates = await Category.exists({
    userId: token.sub,
    updatedAt: { $gt: new Date(lastUpdate) }
  });

  return NextResponse.json({ hasUpdates: !!hasUpdates });
}
```

Então no frontend:

```typescript
const { data: hasUpdates } = useQuery({
  queryKey: ['categories-check', dataUpdatedAt],
  queryFn: async () => {
    const res = await fetch(`/api/categories/check-updates?lastUpdate=${dataUpdatedAt}`);
    return res.json();
  },
  refetchInterval: 3000,
});

// Só faz refetch completo se houver mudanças
if (hasUpdates) {
  queryClient.invalidateQueries(['categories']);
}
```

---

## 📊 Monitoramento e Debug

### React Query DevTools (Opcional)

Para visualizar o estado do cache e queries:

```bash
npm install @tanstack/react-query-devtools
```

```tsx
// src/providers/query-provider.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## ✅ Checklist de Implementação

- [ ] Instalar `@tanstack/react-query`
- [ ] Adicionar `QueryProvider` no layout principal
- [ ] Substituir `useCategories` por `useCategoriesQuery` nos componentes
- [ ] Testar polling abrindo a mesma lista em duas abas diferentes
- [ ] Ajustar intervalo de polling conforme necessidade
- [ ] (Opcional) Adicionar DevTools para debug

---

## 🎯 Resultado Esperado

Quando dois usuários estiverem com a mesma lista aberta:

1. **Usuário A** adiciona um produto
2. **Usuário B** vê o produto aparecer automaticamente em até 3 segundos
3. O total (R$ 217,10) é recalculado automaticamente
4. Não há necessidade de recarregar a página

---

## 🔧 Troubleshooting

### Polling não está funcionando

- Verifique se o `QueryProvider` está envolvendo toda a aplicação
- Confirme que `sessionStatus === 'authenticated'`
- Verifique o console para erros de rede

### Muitas requisições

- Aumente o `refetchInterval` para 5000 ou 10000
- Implemente polling condicional baseado em visibilidade

### Dados não atualizam

- Verifique se a API está retornando `updatedAt`
- Confirme que as mutations estão invalidando as queries corretamente

---

## 📚 Recursos Adicionais

- [React Query Docs](https://tanstack.com/query/latest)
- [Polling Guide](https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
