# Category Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o usuário renomeie uma categoria existente a partir de um botão de lápis no card da home, usando um drawer pré-preenchido com o nome atual.

**Architecture:** Reutiliza o `NewCategoryDrawer` com uma prop `categoryToEdit` opcional que ativa o modo de edição (título, botão e handler trocados). O fluxo segue a pilha existente: contexto → `PUT /api/categories?id` → `updateCategory` no Firestore, com `onSnapshot` cuidando da sincronização automática.

**Tech Stack:** Next.js 14, TypeScript, React Hook Form, Firestore Admin SDK (server), Firebase Client SDK (real-time), Sonner (toasts), Lucide React (ícones).

---

## Mapa de arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `src/lib/firestore-domain.ts` |
| Modificar | `src/app/api/categories/route.ts` |
| Modificar | `src/context/CategoryContext.tsx` |
| Modificar | `src/components/new-category-drawer.tsx` |
| Modificar | `src/components/category-card.tsx` |

---

## Task 1: Firestore — `updateCategory`

**Files:**
- Modify: `src/lib/firestore-domain.ts`

- [ ] **Step 1: Adicionar a função `updateCategory` após `deleteCategory`**

Abrir `src/lib/firestore-domain.ts`. Localizar a função `deleteCategory` (linha ~194). Adicionar a função abaixo dela:

```ts
export async function updateCategory(userId: string, categoryId: string, name: string) {
  const category = await getOwnedCategory(categoryId, userId);

  if (!category) {
    return null;
  }

  await categoriesCollection.doc(categoryId).update({
    name,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await categoriesCollection.doc(categoryId).get();

  return categoryFromDoc(updated);
}
```

`getOwnedCategory` já existe no arquivo (função privada). `categoryFromDoc` também já existe. `FieldValue` já é importado.

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firestore-domain.ts
git commit -m "feat: add updateCategory to firestore-domain"
```

---

## Task 2: API — `PUT /api/categories`

**Files:**
- Modify: `src/app/api/categories/route.ts`

- [ ] **Step 1: Adicionar `updateCategory` ao import de `firestore-domain`**

Localizar a linha de import no topo do arquivo (linha ~5):

```ts
import {
  createCategory,
  deleteCategory,
  getCategoryWithProducts,
  getCategoriesWithProducts,
} from '@/lib/firestore-domain';
```

Substituir por (staircase: menor → maior):

```ts
import {
  createCategory,
  deleteCategory,
  updateCategory,
  getCategoryWithProducts,
  getCategoriesWithProducts,
} from '@/lib/firestore-domain';
```

- [ ] **Step 2: Adicionar handler `PUT` ao final do arquivo**

Adicionar após a função `DELETE`:

```ts
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    const data: CategoryData = await request.json();

    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const category = await updateCategory(userId, id, data.name.trim());

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: category }, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/categories/route.ts
git commit -m "feat: add PUT /api/categories endpoint"
```

---

## Task 3: Context — `updateCategory`

**Files:**
- Modify: `src/context/CategoryContext.tsx`

- [ ] **Step 1: Adicionar `updateCategory` à interface `CategoriesContextType`**

Localizar a interface `CategoriesContextType` (linha ~32). Substituir pelo bloco com a nova propriedade na posição correta (staircase, ordered by line length):

```ts
interface CategoriesContextType {
  categories: CategoryProps[];
  selectedCategoryId?: string;
  isLoadingCategories: boolean;
  errorCategories: string | null;
  filteredCategory?: CategoryProps;
  fetchCategories: () => Promise<void>;
  markLocalMutation: (count?: number) => void;
  removeCategory: (id: string) => Promise<void>;
  setSelectedCategoryId: (categoryId: string) => void;
  addCategory: (category: CategoryProps) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryProps[]>>;
}
```

- [ ] **Step 2: Adicionar a implementação `updateCategory` após `removeCategory`**

Localizar a função `removeCategory` (linha ~311). Adicionar logo depois dela:

```ts
const updateCategory = async (id: string, name: string) => {
  markLocalMutation();

  const response = await fetch(`/api/categories?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    localMutationCount.current -= 1;
    toast('Erro ao atualizar categoria');
    return;
  }

  toast('Categoria atualizada com sucesso');
};
```

- [ ] **Step 3: Expor `updateCategory` no valor do provider**

Localizar o `CategoriesContext.Provider` (linha ~380). Substituir o objeto `value` para incluir `updateCategory` na posição correta (staircase por nome da chave):

```tsx
value={{
  categories,
  addCategory,
  setCategories,
  removeCategory,
  updateCategory,
  errorCategories,
  fetchCategories,
  filteredCategory,
  markLocalMutation,
  selectedCategoryId,
  isLoadingCategories,
  setSelectedCategoryId,
}}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/context/CategoryContext.tsx
git commit -m "feat: add updateCategory to CategoryContext"
```

---

## Task 4: `NewCategoryDrawer` — modo de edição

**Files:**
- Modify: `src/components/new-category-drawer.tsx`

- [ ] **Step 1: Adicionar import de `Save` do lucide-react**

Substituir a linha de import do lucide-react:

```ts
import { Plus } from 'lucide-react';
```

Por:

```ts
import { Plus, Save } from 'lucide-react';
```

- [ ] **Step 2: Atualizar a interface de props**

Substituir:

```ts
interface NewCategoryDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

Por (staircase: `open` 15 < `categoryToEdit` 32 < `onOpenChange` 40):

```ts
interface NewCategoryDrawerProps {
  open?: boolean;
  categoryToEdit?: CategoryProps;
  onOpenChange?: (open: boolean) => void;
}
```

- [ ] **Step 3: Reescrever o componente com suporte a modo edit**

Substituir a função inteira `NewCategoryDrawer`:

```tsx
export function NewCategoryDrawer({ open, onOpenChange, categoryToEdit }: NewCategoryDrawerProps) {
  const { addCategory, updateCategory } = useCategories();
  const isEditMode = Boolean(categoryToEdit);

  const methods = useForm<CategoryProps>({
    defaultValues: {
      name: categoryToEdit?.name ?? '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    if (isEditMode && categoryToEdit) {
      updateCategory(categoryToEdit._id, data.name);
    } else {
      addCategory({ name: data.name } as CategoryProps);
    }
    methods.reset();
    onOpenChange?.(false);
  });

  return (
    <ResponsiveProductDialog
      open={open}
      title={isEditMode ? 'Editar categoria' : 'Nova categoria'}
      description="Digite o nome e a categoria fica disponível imediatamente."
      onOpenChange={(value) => {
        if (!value) methods.reset();
        onOpenChange?.(value);
      }}
      footer={(
        <div className="flex flex-col gap-2.5">
          <button
            type="submit"
            form="new-category-form"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background"
          >
            {isEditMode ? (
              <>
                <Save className="h-5 w-5" />
                Salvar
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Criar categoria
              </>
            )}
          </button>

          <p className="text-[13px] font-medium leading-[1.4] text-[#898989]">
            Enter também {isEditMode ? 'salva' : 'cria'} quando o nome estiver preenchido.
          </p>
        </div>
      )}
    >
      <FormProvider {...methods}>
        <form id="new-category-form" onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-[7px]">
            <span className="text-[13px] font-bold leading-[1.35] text-foreground">
              Categoria
            </span>
            <Input
              required
              id="name"
              type="text"
              placeholder="Nome da categoria"
              className="h-10 rounded-lg px-3.5 text-base font-semibold"
              {...methods.register('name')}
            />
          </div>
        </form>
      </FormProvider>
    </ResponsiveProductDialog>
  );
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/new-category-drawer.tsx
git commit -m "feat: add edit mode to NewCategoryDrawer"
```

---

## Task 5: `CategoryCard` — botão Pencil + drawer de edição

**Files:**
- Modify: `src/components/category-card.tsx`

- [ ] **Step 1: Atualizar imports**

Substituir o bloco de imports do arquivo inteiro por (staircase por linha completa, separando grupos externos / internos / relativos):

```ts
'use client';

import { useRouter } from 'next/navigation';
import { isBefore, subWeeks } from 'date-fns';
import { Users, Pencil, Trash2 } from 'lucide-react';
import React, { useEffect, useCallback } from 'react';

import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { CategoryListSkeleton } from '@/components/category-list-skeleton';

import { NewCategoryDrawer } from './new-category-drawer';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';
```

Nota: dentro do grupo `lucide-react`, os nomes são ordenados por tamanho: `Users`(5) < `Pencil`(6) = `Trash2`(6) — em empate, alfabético: P < T.

- [ ] **Step 2: Adicionar estados e handler de edição**

Localizar os quatro `React.useState` existentes (logo após a desestruturação do hook). Substituir o bloco de estados pelo bloco reordenado com os novos (staircase pela linha completa):

```ts
const [openEditDrawer, setOpenEditDrawer] = React.useState<boolean>(false);
const [olderCategories, setOlderCategories] = React.useState<CategoryProps[]>();
const [openRemoveDrawer, setOpenRemoveDrawer] = React.useState<boolean>(false);
const [recentCategories, setRecentCategories] = React.useState<CategoryProps[]>();
const [sharedCategories, setSharedCategories] = React.useState<CategoryProps[]>();
const [selectedCategoryToEdit, setSelectedCategoryToEdit] = React.useState<CategoryProps>();
const [selectedCategoryToRemove, setSelectedCategoryToRemove] = React.useState<CategoryProps>();
```

- [ ] **Step 3: Adicionar `handleEditClick` após `handleRemoveClick`**

```ts
const handleEditClick = useCallback((category: CategoryProps) => {
  setSelectedCategoryToEdit(category);
  setOpenEditDrawer(true);
}, []);
```

- [ ] **Step 4: Atualizar `renderContent` — botão Pencil + dependências do useCallback**

Localizar o botão de delete dentro de `renderContent`. Substituir o trecho `{!isShared && (<button...Trash2...))}` por um Fragment com dois botões:

```tsx
{!isShared && (
  <>
    <button
      onClick={(e) => {
        e.stopPropagation();
        (e.currentTarget as HTMLButtonElement).blur();
        handleEditClick(category);
      }}
      aria-label="Editar categoria"
      className="w-8 h-8 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center flex-shrink-0"
    >
      <Pencil className="h-4 w-4 text-[var(--color-ink)]" />
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        (e.currentTarget as HTMLButtonElement).blur();
        handleRemoveClick(category);
      }}
      aria-label="Remover categoria"
      className="w-8 h-8 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center flex-shrink-0"
    >
      <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
    </button>
  </>
)}
```

Atualizar também o array de dependências do `useCallback` de `renderContent` para incluir `handleEditClick`:

```ts
}, [router, handleEditClick, handleRemoveClick]);
```

- [ ] **Step 5: Adicionar o drawer de edição ao JSX de retorno**

Localizar o bloco `{selectedCategoryToRemove && (<ConfirmRemoveCategoryDrawer.../>)}`. Adicionar antes dele:

```tsx
{selectedCategoryToEdit && (
  <NewCategoryDrawer
    key={selectedCategoryToEdit._id}
    open={openEditDrawer}
    onOpenChange={setOpenEditDrawer}
    categoryToEdit={selectedCategoryToEdit}
  />
)}
```

A prop `key` garante que o formulário reinicia com os valores corretos ao trocar de categoria sem fechar o drawer.

- [ ] **Step 6: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 7: Testar manualmente**

Iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Checklist de verificação:
- [ ] Home exibe botão de lápis à esquerda do lixo em cada categoria própria
- [ ] Categorias compartilhadas **não** exibem o botão de lápis
- [ ] Clicar no lápis abre o drawer com título "Editar categoria" e o campo pré-preenchido com o nome atual
- [ ] Alterar o nome e clicar "Salvar" atualiza o nome na lista sem recarregar a página
- [ ] Toast "Categoria atualizada com sucesso" aparece
- [ ] Clicar em "Criar categoria" (botão +) ainda abre o drawer com título "Nova categoria" e campo vazio

- [ ] **Step 8: Commit**

```bash
git add src/components/category-card.tsx
git commit -m "feat: add edit button and drawer to CategoryCard"
```
