# Leave Shared Category — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que um usuário saia de uma lista compartilhada através de um botão trash no category-card, com confirmação via drawer, sem deletar a lista do dono.

**Architecture:** Nova função Firestore (`leaveSharedList`) usa `arrayRemove` no campo `sharedWith`. Um endpoint `DELETE /api/categories/[id]/leave` expõe isso para o cliente. O `CategoryContext` disponibiliza a action `leaveSharedCategory`, que é chamada por um novo `ConfirmLeaveCategoryDrawer` aberto pelo botão trash no `CategoryCard`.

**Tech Stack:** Next.js 15, Firebase Admin SDK (server), Firebase client SDK (context), TypeScript, Lucide React, Sonner (toast)

---

### Task 1: Função de domínio `leaveSharedList`

**Files:**
- Modify: `src/lib/firestore-domain.ts` (append ao fim do arquivo)

- [ ] **Step 1: Adicionar a função exportada**

Ao fim de `src/lib/firestore-domain.ts`, após `removeGrouping`, adicionar:

```ts
export async function leaveSharedList(
  categoryId: string,
  userId: string
): Promise<'ok' | 'not-found' | 'not-member'> {
  const categoryDoc = await categoriesCollection.doc(categoryId).get();

  if (!categoryDoc.exists) return 'not-found';

  const data = categoryDoc.data()!;
  const sharedWith = Array.isArray(data.sharedWith) ? (data.sharedWith as string[]) : [];

  if (!sharedWith.includes(userId)) return 'not-member';

  await categoriesCollection.doc(categoryId).update({
    sharedWith: FieldValue.arrayRemove(userId),
  });

  return 'ok';
}
```

- [ ] **Step 2: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firestore-domain.ts
git commit -m "feat(domain): add leaveSharedList function"
```

---

### Task 2: Endpoint `DELETE /api/categories/[id]/leave`

**Files:**
- Create: `src/app/api/categories/[id]/leave/route.ts`

- [ ] **Step 1: Criar o arquivo da rota**

```ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { leaveSharedList } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: authSecret });
    const userId = token?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: categoryId } = await context.params;

    const result = await leaveSharedList(categoryId, userId);

    if (result === 'not-found') {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    if (result === 'not-member') {
      return NextResponse.json({ error: 'Você não é membro desta lista' }, { status: 403 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao sair da lista' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/categories/[id]/leave/route.ts
git commit -m "feat(api): add DELETE /api/categories/[id]/leave endpoint"
```

---

### Task 3: Action `leaveSharedCategory` no CategoryContext

**Files:**
- Modify: `src/context/CategoryContext.tsx`

- [ ] **Step 1: Adicionar ao `CategoriesContextType`**

Localizar a interface `CategoriesContextType` (linha ~34) e substituir por versão com o novo campo inserido na posição correta (staircase: 51 chars — entre `removeCategory` com 46 e `setSelectedCategoryId` com 52):

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
  leaveSharedCategory: (id: string) => Promise<void>;
  setSelectedCategoryId: (categoryId: string) => void;
  addCategory: (category: CategoryProps) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryProps[]>>;
}
```

- [ ] **Step 2: Implementar `leaveSharedCategory`**

Após a função `removeCategory` (linha ~337), adicionar:

```ts
const leaveSharedCategory = async (id: string) => {
  markLocalMutation();

  const response = await fetch(`/api/categories/${id}/leave`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    localMutationCount.current -= 1;
    toast('Erro ao sair da lista');
    return;
  }

  setCategories((prev) => prev.filter((c) => c._id !== id));
  toast('Você saiu da lista');
};
```

- [ ] **Step 3: Expor pelo Provider**

No `CategoriesContext.Provider` (linha ~406), atualizar o objeto `value` incluindo `leaveSharedCategory`. Reordenar seguindo a staircase (cada chave é uma linha, ordenar por comprimento da linha):

```tsx
<CategoriesContext.Provider
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
    leaveSharedCategory,
    setSelectedCategoryId,
  }}
>
```

- [ ] **Step 4: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/context/CategoryContext.tsx
git commit -m "feat(context): add leaveSharedCategory action"
```

---

### Task 4: Drawer de confirmação `ConfirmLeaveCategoryDrawer`

**Files:**
- Create: `src/components/confirm-leave-category-drawer.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

interface ConfirmLeaveCategoryDrawerProps {
  open: boolean;
  category?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmLeaveCategoryDrawer({
  open,
  category,
  onOpenChange,
}: ConfirmLeaveCategoryDrawerProps) {
  const { leaveSharedCategory } = useCategories();

  const [isLeaving, setIsLeaving] = React.useState(false);

  const handleLeave = async () => {
    if (isLeaving || !category) return;
    setIsLeaving(true);
    await leaveSharedCategory(category._id);
    setIsLeaving(false);
    onOpenChange(false);
  };

  if (!category) return null;

  return (
    <ResponsiveProductDialog
      open={open}
      title="Sair da lista"
      description={`Você vai sair de "${category.name}". Você não perderá os itens adicionados, mas deixará de ter acesso a ela.`}
      onOpenChange={onOpenChange}
      footer={(
        <button
          type="button"
          disabled={isLeaving}
          onClick={handleLeave}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-error)] text-sm font-semibold text-white disabled:opacity-60"
        >
          <Trash2 className="h-5 w-5" />
          {isLeaving ? 'Saindo…' : 'Sair da lista'}
        </button>
      )}
    >
      <div className="rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
        <p className="text-sm font-medium text-foreground">
          Esta ação não pode ser desfeita.
        </p>
      </div>
    </ResponsiveProductDialog>
  );
}
```

- [ ] **Step 2: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/confirm-leave-category-drawer.tsx
git commit -m "feat(ui): add ConfirmLeaveCategoryDrawer component"
```

---

### Task 5: Botão trash no `CategoryCard` para listas compartilhadas

**Files:**
- Modify: `src/components/category-card.tsx`

- [ ] **Step 1: Atualizar imports**

Substituir o bloco de imports relativos (últimas 2 linhas de import) para incluir o novo drawer, mantendo a staircase (58 → 77 → 79 chars):

```tsx
import { NewCategoryDrawer } from './new-category-drawer';
import { ConfirmLeaveCategoryDrawer } from './confirm-leave-category-drawer';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';
```

- [ ] **Step 2: Adicionar estado para o drawer de saída**

Após o estado `selectedCategoryToRemove` (linha ~25), adicionar:

```tsx
const [openLeaveDrawer, setOpenLeaveDrawer] = React.useState<boolean>(false);
const [selectedCategoryToLeave, setSelectedCategoryToLeave] = React.useState<CategoryProps>();
```

- [ ] **Step 3: Adicionar handler `handleLeaveClick`**

Após `handleEditClick` (linha ~38), adicionar:

```tsx
const handleLeaveClick = useCallback((category: CategoryProps) => {
  setSelectedCategoryToLeave(category);
  setOpenLeaveDrawer(true);
}, []);
```

- [ ] **Step 4: Adicionar botão trash na seção compartilhada**

Dentro da função `renderContent`, após o bloco `{!isShared && (...)}` (linha ~107), adicionar:

```tsx
{isShared && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      (e.currentTarget as HTMLButtonElement).blur();
      handleLeaveClick(category);
    }}
    aria-label="Sair da lista"
    className="w-8 h-8 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center flex-shrink-0"
  >
    <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
  </button>
)}
```

- [ ] **Step 5: Atualizar dependências do `useCallback` de `renderContent`**

Localizar a linha de dependências de `renderContent` (linha ~141):

```tsx
}, [router, handleEditClick, handleRemoveClick]);
```

Substituir por (staircase: router=6, handleEditClick=15, handleLeaveClick=16, handleRemoveClick=17):

```tsx
}, [router, handleEditClick, handleLeaveClick, handleRemoveClick]);
```

- [ ] **Step 6: Montar o drawer de saída no JSX**

Após o bloco `{selectedCategoryToRemove && (...)}` (linha ~185), adicionar:

```tsx
{selectedCategoryToLeave && (
  <ConfirmLeaveCategoryDrawer
    key={selectedCategoryToLeave._id}
    open={openLeaveDrawer}
    onOpenChange={setOpenLeaveDrawer}
    category={selectedCategoryToLeave}
  />
)}
```

- [ ] **Step 7: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/components/category-card.tsx
git commit -m "feat(ui): add leave button to shared category cards"
```

---

### Task 6: Verificação manual

- [ ] **Step 1: Subir o servidor de desenvolvimento**

```bash
npm run dev
```

- [ ] **Step 2: Testar o fluxo feliz**

1. Logar com usuário B (que tem acesso a uma lista compartilhada)
2. Na listagem de categorias, confirmar que o botão trash aparece nas categorias da seção "Compartilhadas"
3. Clicar no botão trash — confirmar que o drawer abre com título "Sair da lista" e nome correto
4. Clicar em "Sair da lista" — confirmar que o toast "Você saiu da lista" aparece e a categoria some da listagem
5. Logar com o usuário A (dono) — confirmar que a lista ainda existe

- [ ] **Step 3: Testar cancelamento**

1. Abrir o drawer de confirmação
2. Clicar em "Cancelar" — confirmar que o drawer fecha sem remover a categoria

- [ ] **Step 4: Verificar que o botão NÃO aparece em listas próprias**

Confirmar que categorias na seção "Minhas listas" não exibem o novo botão trash de saída (apenas os botões de editar e remover existentes).
