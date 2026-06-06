# Categories Listing Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os componentes shadcn da tela de listagem de categorias por HTML nativo com tokens Cal DS, e atualizar o botão "Adicionar categoria" para o estilo full-width do design system.

**Architecture:** Quatro arquivos alterados. `globals.css` recebe o token `--color-surface-soft`. `category-card.tsx` é refatorado: título Cal Sans, section labels muted, CategoryCardItem com Stat Pill e Delete Row. `new-category-drawer.tsx` tem o trigger atualizado para button full-width Cal DS. `footer.tsx` tem o container do trigger ajustado para suportar full-width na home page. Nenhuma mudança em lógica de dados, contexto, tipos ou rotas.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3.4, TypeScript 5, lucide-react, vaul (Drawer)

---

## File Map

| Arquivo | Ação | O que muda |
|---------|------|------------|
| `src/app/globals.css` | Modify | Adiciona `--color-surface-soft` em `:root` e `.dark` |
| `src/components/category-card.tsx` | Modify | Imports, `renderContent`, return JSX |
| `src/components/new-category-drawer.tsx` | Modify | `DrawerTrigger` → button Cal DS full-width |
| `src/components/footer.tsx` | Modify | Container do drawer na home page → `w-full p-4` |

---

## Task 1: Add `--color-surface-soft` CSS token

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Adicionar em `:root` (light mode)**

Em `src/app/globals.css`, após a linha `--color-error: #ef4444;` (linha 46), inserir:

```css
    --color-surface-soft: #f8f9fa;
```

- [ ] **Step 2: Adicionar em `.dark`**

Em `src/app/globals.css`, após a linha `--color-on-primary: #111111;` (dentro do bloco `.dark`, linha 88), inserir:

```css
    --color-surface-soft: #141414;
```

- [ ] **Step 3: Lint check**

```bash
npm run lint
```

Esperado: sem novos erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add --color-surface-soft Cal DS token"
```

---

## Task 2: Refactor category-card.tsx

**Files:**
- Modify: `src/components/category-card.tsx`

- [ ] **Step 1: Substituir o bloco de imports**

Substituir o bloco de imports completo (linhas 1–15) de `src/components/category-card.tsx` por:

```tsx
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isBefore, subWeeks } from 'date-fns';
import React, { useEffect, useCallback } from 'react';

import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmRemoveCategoryDrawer } from './confirm-remove-category-drawer';
```

Removidos: `Button`, `Card`/`CardTitle`/`CardHeader`, `Badge`, `Separator`, `PageTitle`.

- [ ] **Step 2: Substituir a função `renderContent`**

Localizar a função `renderContent` (começa com `const renderContent = useCallback`) e substituir a função inteira por:

```tsx
const renderContent = useCallback((renderCategories: CategoryProps[]) => {
  if (isLoadingCategories) {
    return Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={index} className="h-[86px] w-full rounded-[var(--radius-lg)]" />
    ));
  }

  if (renderCategories) {
    return renderCategories.map(category => (
      <div
        key={category._id}
        className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-canvas)]"
      >
        <div
          className="flex cursor-pointer items-center justify-between gap-2 px-4 py-[14px]"
          onClick={() => router.push(`/category?id=${category._id}`)}
        >
          <span className="flex-1 text-base font-semibold leading-snug text-[var(--color-ink)]">
            {category.name}
          </span>
          {(category.products?.length ?? 0) > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-surface-card)] px-3 py-[9px]">
              <span className="text-[13px] font-medium text-[var(--color-ink)]">
                {(category.products ?? []).length}
              </span>
              <span className="text-[13px] font-medium text-[var(--color-ink)]">
                produtos
              </span>
            </span>
          )}
        </div>

        <div className="h-px w-full bg-[var(--color-hairline)]" />

        <button
          onClick={() => handleRemoveClick(category)}
          className="flex h-10 w-full items-center justify-center bg-[var(--color-surface-soft)] transition-colors hover:bg-[var(--color-surface-card)]"
        >
          <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
        </button>
      </div>
    ));
  }

  return null;
}, [isLoadingCategories, router]);
```

`handleRemoveClick` e `isLoadingCategories` estão definidos no escopo do componente — sem alteração necessária.

- [ ] **Step 3: Substituir o return JSX**

Substituir o bloco `return (...)` completo (o `<main>...</main>`) por:

```tsx
return (
  <main className="flex flex-col gap-4">
    <h1 className="font-sans text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-[var(--color-ink)]">
      Categorias
    </h1>

    {recentCategories && recentCategories.length > 0 && (
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--color-muted)]">Atualizadas</p>
        {renderContent(recentCategories)}
      </section>
    )}

    {olderCategories && olderCategories.length > 0 && (
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--color-muted)]">Antigas</p>
        {renderContent(olderCategories)}
      </section>
    )}

    {selectedCategoryToRemove && (
      <ConfirmRemoveCategoryDrawer
        open={openRemoveDrawer}
        onOpenChange={setOpenRemoveDrawer}
        category={selectedCategoryToRemove}
      />
    )}
  </main>
);
```

A padding horizontal (`p-4`) é fornecida pelo componente pai `MainContent` — não adicionar `px-4` aqui.

- [ ] **Step 4: Lint check**

```bash
npm run lint
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/category-card.tsx
git commit -m "feat: redesign category listing with Cal DS tokens"
```

---

## Task 3: Update NewCategoryDrawer trigger button

**Files:**
- Modify: `src/components/new-category-drawer.tsx`

- [ ] **Step 1: Substituir import de ícone**

Em `src/components/new-category-drawer.tsx`, linha 4:

```tsx
// ANTES
import { CirclePlus } from 'lucide-react';

// DEPOIS
import { Plus } from 'lucide-react';
```

- [ ] **Step 2: Substituir o bloco `DrawerTrigger`**

Localizar o bloco `<DrawerTrigger asChild>` (linha ~41) e substituir por:

```tsx
<DrawerTrigger asChild>
  <button
    onClick={() => setOpen?.(true)}
    className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] transition-opacity active:opacity-80"
    aria-label="Adicionar categoria"
  >
    <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
    <span className="text-sm font-semibold text-[var(--color-on-primary)]">
      Adicionar categoria
    </span>
  </button>
</DrawerTrigger>
```

- [ ] **Step 3: Atualizar ícone do botão de submit dentro do drawer**

Na linha ~70 (submit button dentro do form), substituir:

```tsx
// ANTES
<ActionButton type="submit" icon={CirclePlus}/>

// DEPOIS
<ActionButton type="submit" icon={Plus}/>
```

`ActionButton` permanece importado — ainda é usado neste submit button.

- [ ] **Step 4: Lint check**

```bash
npm run lint
```

Esperado: sem erros.

---

## Task 4: Update footer container

**Files:**
- Modify: `src/components/footer.tsx`

- [ ] **Step 1: Atualizar o container do trigger na home page**

Em `src/components/footer.tsx`, localizar o `<div className="flex items-center gap-2">` que envolve os botões (linha ~43). Substituir esse bloco por:

```tsx
<div className={isHomePage ? 'w-full p-4' : 'flex items-center gap-2'}>
  {!isHomePage ? (
    <NewProductForm />
  ) : (
    <NewCategoryDrawer />
  )}
</div>
```

Isso faz o `NewCategoryDrawer` renderizar em container full-width com padding quando na home page, preservando o layout existente nas outras páginas.

- [ ] **Step 2: Lint check**

```bash
npm run lint
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/new-category-drawer.tsx src/components/footer.tsx
git commit -m "feat: update Adicionar Categoria button to full-width Cal DS style"
```

---

## Task 5: Build verification + smoke test

**Files:** nenhum

- [ ] **Step 1: Build completo**

```bash
npm run build
```

Esperado: build completa sem erros de TypeScript ou compilação.

- [ ] **Step 2: Smoke test visual**

```bash
npm run dev
```

Navegar para `http://localhost:3000` e verificar:

- [ ] Título "Categorias" renderiza em Cal Sans, peso 600, tracking negativo (visualmente mais condensado que Inter)
- [ ] Cards com fundo branco, borda 1px hairline cinza, border-radius 12px
- [ ] Badge Stat Pill: número e "produtos" lado a lado em pill cinza
- [ ] Categorias sem produtos não mostram badge
- [ ] Ícone lixeira em vermelho, área abaixo do divider com fundo levemente diferente (surface-soft)
- [ ] Clicar na área de nome/badge navega para `/category?id=...`
- [ ] Clicar na lixeira abre drawer de confirmação
- [ ] Footer na home page: botão "Adicionar categoria" full-width, preto, com ícone `+`
- [ ] Clicar em "Adicionar categoria" abre o drawer de criação
- [ ] Dark mode: fundo escuro, borda escura, texto claro, badge em surface-card dark
- [ ] Estado de loading: 4 skeletons de altura 86px com border-radius 12px

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: complete categories listing redesign"
```
