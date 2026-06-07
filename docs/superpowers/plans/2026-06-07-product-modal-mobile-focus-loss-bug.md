# Product Modal Mobile Focus-Loss Bug Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir cinco bugs de gerenciamento de estado que causam erro falso na criação e campos vazios na edição de produtos após o app ser enviado ao background no mobile.

**Architecture:** Três grupos de mudanças em arquivos distintos. ProductContext recebe re-throw de erro e functional updates para eliminar closures estáticas. CategoryContext recebe o mesmo padrão de functional updates. ProductManagerSheet recebe onSubmit async (depende do re-throw), correção de deps do useEffect e tratamento de falha no fetch de edição. Não há setup de testes automatizados no projeto — verificação é manual via DevTools.

**Tech Stack:** Next.js 15, React 19, TypeScript, React Hook Form 7, Vaul 1 (drawer), Sonner 1 (toast)

---

### Task 1: ProductContext — re-throw + functional updates

**Files:**
- Modify: `src/context/ProductContext.tsx`

- [ ] **Step 1: Adicionar `throw err` no catch de `managerProduct`**

Localizar o catch block de `managerProduct` (linha ~172). Substituir:

```typescript
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
```

Por:

```typescript
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
    throw err;
  } finally {
```

- [ ] **Step 2: Functional update — edit path, categoria mudou**

Localizar o bloco `setCategories` dentro do `if (oldCategory && oldCategory._id !== updatedProduct.category._id)` (~linha 119). Substituir:

```typescript
          setCategories(categories.map(category => {

            if (category._id === oldCategory._id) {
              return {
                ...category,
                products: (category.products || []).filter(p => p._id !== updatedProduct._id)
              };
            }

            if (category._id === updatedProduct.category._id) {
              return {
                ...category,
                products: [...(category.products || []), updatedProduct]
              };
            }

            return category;
          }));
```

Por:

```typescript
          setCategories(prev => prev.map(category => {

            if (category._id === oldCategory._id) {
              return {
                ...category,
                products: (category.products || []).filter(p => p._id !== updatedProduct._id)
              };
            }

            if (category._id === updatedProduct.category._id) {
              return {
                ...category,
                products: [...(category.products || []), updatedProduct]
              };
            }

            return category;
          }));
```

- [ ] **Step 3: Functional update — edit path, mesma categoria**

Localizar o `else` do bloco acima (~linha 138). Substituir:

```typescript
          setCategories(categories.map(category => ({
            ...category,
            products: category?.products?.map(product =>
              product?._id === updatedProduct?._id ? updatedProduct : product
            )
          })));
```

Por:

```typescript
          setCategories(prev => prev.map(category => ({
            ...category,
            products: category?.products?.map(product =>
              product?._id === updatedProduct?._id ? updatedProduct : product
            )
          })));
```

- [ ] **Step 4: Functional update — create path**

Localizar o `setCategories` dentro do `else` (create, ~linha 163). Substituir:

```typescript
        setCategories(categories.map(category => ({
          ...category,
          products: category?._id === newProduct.category?._id ? [...category.products || [], newProduct] : category.products
        })));
```

Por:

```typescript
        setCategories(prev => prev.map(category => ({
          ...category,
          products: category?._id === newProduct.category?._id ? [...category.products || [], newProduct] : category.products
        })));
```

- [ ] **Step 5: Functional update — `removeProduct`**

Localizar o `setCategories` dentro de `removeProduct` (~linha 197). Substituir:

```typescript
      setCategories(categories.map(category => ({
        ...category,
        products: category.products?.filter(product => product._id !== id)
      })));
```

Por:

```typescript
      setCategories(prev => prev.map(category => ({
        ...category,
        products: category.products?.filter(product => product._id !== id)
      })));
```

- [ ] **Step 6: Functional update — `removeAllProducts`**

Localizar o `setCategories` dentro de `removeAllProducts` (~linha 217). Substituir:

```typescript
      setCategories(categories.map(category => ({
        ...category,
        products: []
      })));
```

Por:

```typescript
      setCategories(prev => prev.map(category => ({
        ...category,
        products: []
      })));
```

- [ ] **Step 7: Functional update — `toggleCart`**

Localizar o `setCategories` dentro de `toggleCart` (~linha 251). Substituir:

```typescript
      setCategories(categories.map(category => ({
        ...category,
        products: category.products?.map(product => product._id === id ? updatedProduct : product)
      })));
```

Por:

```typescript
      setCategories(prev => prev.map(category => ({
        ...category,
        products: category.products?.map(product => product._id === id ? updatedProduct : product)
      })));
```

- [ ] **Step 8: Rodar lint**

```bash
npm run lint
```

Resultado esperado: sem erros ou warnings.

- [ ] **Step 9: Commit**

```bash
git add src/context/ProductContext.tsx
git commit -m "fix: re-throw error in managerProduct and use functional updates in ProductContext"
```

---

### Task 2: CategoryContext — functional updates

**Files:**
- Modify: `src/context/CategoryContext.tsx`

- [ ] **Step 1: Functional update — `addCategory`**

Localizar a função `addCategory` (~linha 38). Substituir as três últimas linhas do corpo da função (de `const updatedCategories` até o `toast`):

```typescript
    const updatedCategories = [...categories, data].sort((categoryA, categoryB) =>
      categoryA.name.localeCompare(categoryB.name, 'pt-BR', { sensitivity: 'base' })
    );

    setCategories(updatedCategories);
    toast('Categoria criada com sucesso');
```

Por:

```typescript
    setCategories(prev =>
      [...prev, data].sort((categoryA, categoryB) =>
        categoryA.name.localeCompare(categoryB.name, 'pt-BR', { sensitivity: 'base' })
      )
    );
    toast('Categoria criada com sucesso');
```

- [ ] **Step 2: Functional update — `removeCategory`**

Localizar o `setCategories` dentro de `removeCategory` (~linha 73). Substituir:

```typescript
      setCategories(categories.filter(category => category._id !== id));
```

Por:

```typescript
      setCategories(prev => prev.filter(category => category._id !== id));
```

- [ ] **Step 3: Rodar lint**

```bash
npm run lint
```

Resultado esperado: sem erros ou warnings.

- [ ] **Step 4: Commit**

```bash
git add src/context/CategoryContext.tsx
git commit -m "fix: functional updates in CategoryContext to avoid stale closure"
```

---

### Task 3: ProductManagerSheet — onSubmit async

**Files:**
- Modify: `src/components/product-manager-sheet.tsx:54-58`

Esta task depende da Task 1 (Step 1): sem o `throw err` em `managerProduct`, o `catch` aqui nunca seria executado e o modal fecharia mesmo em caso de erro.

- [ ] **Step 1: Tornar `onSubmit` async e fechar modal somente no sucesso**

Localizar `onSubmit` (~linha 54). Substituir:

```typescript
  const onSubmit = methods.handleSubmit((data) => {
    managerProduct({ product: { ...data, categoryId: data.categoryId } });
    methods.reset();
    onOpenChange?.(false);
  });
```

Por:

```typescript
  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      await managerProduct({ product: { ...data, categoryId: data.categoryId } });
      methods.reset();
      onOpenChange?.(false);
    } catch {
      // erro já tratado em managerProduct via toast e setError
    }
  });
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Resultado esperado: sem erros ou warnings.

---

### Task 4: ProductManagerSheet — corrigir deps do useEffect

**Files:**
- Modify: `src/components/product-manager-sheet.tsx:113`

- [ ] **Step 1: Remover `categories.length` e `methods` do array de deps**

Localizar o fechamento do `useEffect` (linha 113). Substituir:

```typescript
  }, [open, product?._id, isEdit, categories.length, selectedCategoryId, methods]);
```

Por:

```typescript
  }, [open, product?._id, isEdit, selectedCategoryId]);
```

A guarda `categories.length > 0` no corpo do effect (~linha 98) permanece intocada — ela ainda previne o reset do form antes das categorias carregarem.

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Resultado esperado: sem erros ou warnings.

---

### Task 5: ProductManagerSheet — tratar falha no fetch de edição

**Files:**
- Modify: `src/components/product-manager-sheet.tsx:1-18` (imports)
- Modify: `src/components/product-manager-sheet.tsx:87-93`

- [ ] **Step 1: Adicionar import de `toast`**

No topo do arquivo, adicionar após a linha `'use client';`:

```typescript
import { toast } from 'sonner';
```

O bloco de imports completo ficará:

```typescript
'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { X, Plus, Check } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useForm, FormProvider } from 'react-hook-form';
```

- [ ] **Step 2: Substituir `console.error` por toast + fechar modal**

Localizar o catch block dentro de `doFetch` (~linha 87). Substituir:

```typescript
        } catch (error) {
          if ((error as { name?: string }).name !== 'AbortError') {
            console.error('Error fetching product:', error);
          }
        }
```

Por:

```typescript
        } catch (error) {
          if ((error as { name?: string }).name !== 'AbortError') {
            toast.error('Não foi possível carregar o produto. Tente novamente.');
            onOpenChange?.(false);
          }
        }
```

- [ ] **Step 3: Rodar lint**

```bash
npm run lint
```

Resultado esperado: sem erros ou warnings.

- [ ] **Step 4: Commit (Tasks 3, 4 e 5 juntas)**

```bash
git add src/components/product-manager-sheet.tsx
git commit -m "fix: async onSubmit, remove stale useEffect deps, toast on edit fetch failure"
```

---

### Task 6: Verificação manual

- [ ] **Step 1: Iniciar dev server**

```bash
npm run dev
```

Acessar `http://localhost:3000`.

- [ ] **Step 2: Criação — fluxo normal**

1. Navegar para uma categoria
2. Clicar em "Novo produto", preencher o nome
3. Clicar "Adicionar produto"
4. **Esperado:** Modal fecha, produto aparece na lista, toast de sucesso

- [ ] **Step 3: Criação — falha de rede**

1. DevTools → Network → marcar "Offline"
2. Abrir modal de novo produto, preencher nome
3. Clicar "Adicionar produto"
4. **Esperado:** Modal permanece aberto, toast de erro aparece, nome continua no campo
5. Desmarcar "Offline"
6. Clicar "Adicionar produto" novamente
7. **Esperado:** Produto criado, modal fecha, toast de sucesso

- [ ] **Step 4: Edição — fluxo normal**

1. Navegar para categoria com produtos
2. Clicar no ícone de edição de um produto
3. **Esperado:** Modal abre com nome e demais campos preenchidos
4. Alterar o nome, clicar "Salvar alterações"
5. **Esperado:** Modal fecha, produto atualizado na lista

- [ ] **Step 5: Edição — fetch falha**

1. DevTools → Network → bloquear URL `api/products` (botão direito na requisição → "Block request URL")
2. Clicar no ícone de edição de um produto
3. **Esperado:** Modal fecha automaticamente, toast "Não foi possível carregar o produto. Tente novamente."
4. Remover o bloqueio
5. Clicar em editar novamente
6. **Esperado:** Modal abre com dados corretos

- [ ] **Step 6: Simular background**

1. Abrir modal de novo produto, preencher o nome
2. Trocar para outra aba por 5-10 segundos e voltar
3. Clicar "Adicionar produto"
4. **Esperado:** Produto criado, modal fecha, sem toast de erro falso

- [ ] **Step 7: Verificar console**

Abrir DevTools → Console. Confirmar que não há erros do tipo `console.error('Error fetching product')` durante o fluxo de edição.
