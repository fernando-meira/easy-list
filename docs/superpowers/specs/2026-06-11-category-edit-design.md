# Category Edit — Design Spec

**Date:** 2026-06-11
**Status:** Approved

## Overview

Adiciona a capacidade de renomear uma categoria existente. O único campo editável é `name`. A edição é acionada pelo card da home (lista de categorias), através de um novo botão de lápis ao lado do botão de delete.

## Fluxo geral

```
CategoryCard (botão Pencil)
  → NewCategoryDrawer (modo edit, pré-preenchido)
    → CategoryContext.updateCategory(id, name)
      → PUT /api/categories?id={id}
        → firestore-domain.updateCategory(userId, categoryId, name)
          → Firestore (atualiza name + updatedAt)
            → onSnapshot → CategoryContext re-render automático
```

O `onSnapshot` existente cuida da sincronização em tempo real. `markLocalMutation()` é chamado antes do fetch para evitar flicker.

## API

**Método:** `PUT /api/categories?id={categoryId}`
**Arquivo:** `src/app/api/categories/route.ts` (novo método no arquivo existente)

- Valida `userId` via JWT (mesmo padrão do `DELETE`)
- Valida que `name` está presente e é string não-vazia
- Verifica ownership: categoria deve pertencer ao `userId`
- Retorna `200` com a categoria atualizada

## Firestore

**Função:** `updateCategory(userId: string, categoryId: string, name: string)`
**Arquivo:** `src/lib/firestore-domain.ts`

- Busca o documento e valida que `userId` coincide com o campo `userId` da categoria
- Atualiza somente `name` e `updatedAt: FieldValue.serverTimestamp()`

## Context

**Método:** `updateCategory(id: string, name: string): Promise<void>`
**Arquivo:** `src/context/CategoryContext.tsx`

- Chama `markLocalMutation()` antes do fetch
- `PUT /api/categories?id={id}` com `{ name }` no body
- Toast de sucesso/erro seguindo o padrão existente (`addCategory`, `removeCategory`)
- Exposto via `useCategories()`

## Componente: `NewCategoryDrawer`

**Arquivo:** `src/components/new-category-drawer.tsx`

Nova prop opcional:

```ts
categoryToEdit?: CategoryProps
```

Comportamento quando `categoryToEdit` está presente (modo edit):

| Elemento | Valor atual (create) | Valor no edit |
|----------|----------------------|---------------|
| Título   | "Nova categoria"     | "Editar categoria" |
| Input    | vazio                | pré-preenchido com `categoryToEdit.name` |
| Botão    | "Criar"              | "Salvar" |
| Submit   | `addCategory()`      | `updateCategory(categoryToEdit._id, name)` |

Quando `categoryToEdit` está ausente, comportamento idêntico ao atual.

## Componente: `CategoryCard`

**Arquivo:** `src/components/category-card.tsx`

Para categorias não-compartilhadas (`!isShared`), adicionar à esquerda do `Trash2` (ordem: badge → pencil → trash):

- Botão com ícone `Pencil` (lucide-react)
- Mesmo estilo do botão de delete: circular, `bg-[var(--color-surface-card)]`, `h-8 w-8`
- Cor do ícone: `text-[var(--color-ink)]`
- `e.stopPropagation()` para não navegar
- `(e.currentTarget as HTMLButtonElement).blur()` para remover foco (padrão do delete)

Novos estados locais:

```ts
const [openEditDrawer, setOpenEditDrawer] = React.useState<boolean>(false);
const [selectedCategoryToEdit, setSelectedCategoryToEdit] = React.useState<CategoryProps>();
```

Handler:

```ts
const handleEditClick = useCallback((category: CategoryProps) => {
  setSelectedCategoryToEdit(category);
  setOpenEditDrawer(true);
}, []);
```

Renderização do drawer (ao lado do `ConfirmRemoveCategoryDrawer` existente):

```tsx
{selectedCategoryToEdit && (
  <NewCategoryDrawer
    open={openEditDrawer}
    onOpenChange={setOpenEditDrawer}
    categoryToEdit={selectedCategoryToEdit}
  />
)}
```

## Restrições

- Edição disponível apenas para categorias próprias (`!isShared`)
- Não é possível editar categorias compartilhadas com o usuário
- Validação de ownership tanto no cliente (botão oculto para `isShared`) quanto no servidor (API verifica `userId`)
