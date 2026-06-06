# Category Drawer Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o wrapper `DrawerContent` por `DrawerPrimitive` (Vaul) nos dois drawers de categoria, aplicar a linguagem visual do `ProductManagerSheet`, e extrair o trigger do `NewCategoryDrawer` para o `footer.tsx`.

**Architecture:** Dois componentes modificados (`new-category-drawer.tsx` e `confirm-remove-category-drawer.tsx`) + um consumidor atualizado (`footer.tsx`). Nenhum arquivo novo. A interface de props do `ConfirmRemoveCategoryDrawer` permanece idêntica; o `NewCategoryDrawer` passa a aceitar `open`/`onOpenChange` em vez de gerenciar seu próprio estado.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Vaul (`vaul` — já instalado), react-hook-form, lucide-react.

---

## Contexto de referência

```ts
// src/types/interfaces.ts
interface CategoryProps {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  products?: ProductProps[];
}
```

```ts
// src/context/CategoryContext.tsx — hooks relevantes
const { addCategory } = useCategories();     // POST /api/categories
const { removeCategory } = useCategories();  // DELETE /api/categories?id=${id}
```

```ts
// src/lib/utils.ts
export function cn(...inputs: ClassValue[]): string  // clsx + twMerge
```

O `Drawer as DrawerPrimitive` vem de `'vaul'` — mesmo import usado em `product-manager-sheet.tsx`.

**Base SHA para revisões de código:** `8dc823a` (commit do spec)

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Modificar | `src/components/new-category-drawer.tsx` |
| Modificar | `src/components/footer.tsx` |
| Modificar | `src/components/confirm-remove-category-drawer.tsx` |

---

## Task 1: Redesign `NewCategoryDrawer` + atualizar `footer.tsx`

**Files:**
- Modify: `src/components/new-category-drawer.tsx`
- Modify: `src/components/footer.tsx`

- [ ] **Step 1: Substituir `new-category-drawer.tsx` completamente**

```tsx
// src/components/new-category-drawer.tsx
'use client';

import { X, Plus } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useForm, FormProvider } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { CategoryProps } from '@/types/interfaces';

interface NewCategoryDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewCategoryDrawer({ open, onOpenChange }: NewCategoryDrawerProps) {
  const { addCategory } = useCategories();

  const methods = useForm<CategoryProps>({
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    addCategory(data);
    methods.reset();
    onOpenChange?.(false);
  });

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  Nova categoria
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  Digite o nome e a categoria fica disponível imediatamente.
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => onOpenChange?.(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <FormProvider {...methods}>
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

                <div className="flex flex-col gap-2.5">
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background"
                  >
                    <Plus className="h-5 w-5" />
                    Criar categoria
                  </button>

                  <p className="text-[13px] font-medium leading-[1.4] text-[#898989]">
                    Enter também cria quando o nome estiver preenchido.
                  </p>
                </div>
              </form>
            </FormProvider>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
```

- [ ] **Step 2: Atualizar `footer.tsx` — mover trigger e gerenciar estado**

```tsx
// src/components/footer.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { PagesEnum } from '@/types/enums';
import { convertToCurrency } from '@/utils';
import { calculateTotalValue } from '@/utils';
import { useProducts } from '@/context/ProductContext';

import { NewProductForm } from './new-product-form';
import { NewCategoryDrawer } from './new-category-drawer';

export function Footer() {
  const pathname = usePathname();
  const { products, allProductsWithoutPrice, allProductsInCartWithoutPrice } = useProducts();
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);

  const isHomePage = pathname === PagesEnum.home;
  const shouldRenderPrice = !!products && !isHomePage && (!allProductsWithoutPrice || !allProductsInCartWithoutPrice);

  return (
    <footer className={'fixed bottom-0 w-full m-auto rounded-t-sm max-w-3xl bg-white dark:bg-background'}>
      {shouldRenderPrice && (
        <div className="p-4 flex justify-between gap-4 mx-auto">
          {!allProductsWithoutPrice && (
            <p className="font-semibold">Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}</p>
          )}

          {!allProductsInCartWithoutPrice && (
            <p className="font-semibold text-teal-400">Carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}</p>
          )}
        </div>
      )}

      <div className={isHomePage ? 'w-full p-4' : 'flex items-center gap-2'}>
        {!isHomePage ? (
          <NewProductForm />
        ) : (
          <>
            <button
              onClick={() => setCategoryDrawerOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
              aria-label="Adicionar categoria"
            >
              <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
              <span className="text-sm font-semibold text-[var(--color-on-primary)]">
                Adicionar categoria
              </span>
            </button>

            <NewCategoryDrawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen} />
          </>
        )}
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Checar tipos**

```powershell
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/new-category-drawer.tsx src/components/footer.tsx
git commit -m "feat: redesign NewCategoryDrawer with Vaul bottom sheet and extract trigger to footer"
```

---

## Task 2: Redesign `ConfirmRemoveCategoryDrawer`

**Files:**
- Modify: `src/components/confirm-remove-category-drawer.tsx`

- [ ] **Step 1: Substituir `confirm-remove-category-drawer.tsx` completamente**

A interface de props **não muda** — apenas o visual. Nenhum ajuste necessário nos consumidores.

```tsx
// src/components/confirm-remove-category-drawer.tsx
'use client';

import { toast } from 'sonner';
import { X, Trash } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { CategoryProps } from '@/types/interfaces';

interface ConfirmRemoveCategoryDrawerProps {
  open: boolean;
  category?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmRemoveCategoryDrawer({ category, open, onOpenChange }: ConfirmRemoveCategoryDrawerProps) {
  const { removeCategory } = useCategories();

  const handleRemoveCategory = () => {
    if (!category) {
      toast('Categoria não encontrada');
      return;
    }

    removeCategory(category._id);
    onOpenChange(false);
  };

  if (!category) return null;

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  {category.name}
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  Tem certeza que deseja remover esta categoria?
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
              <p className="text-sm font-medium text-foreground">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemoveCategory}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-error)] text-sm font-semibold text-white"
            >
              <Trash className="h-5 w-5" />
              Remover {category.name}
            </button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
```

- [ ] **Step 2: Checar tipos**

```powershell
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/confirm-remove-category-drawer.tsx
git commit -m "feat: redesign ConfirmRemoveCategoryDrawer with Vaul bottom sheet"
```

---

## Checklist de conclusão

- [ ] `NewCategoryDrawer` não tem mais trigger interno nem estado `open` próprio
- [ ] Botão "Adicionar categoria" em `footer.tsx` abre o drawer corretamente
- [ ] Bottom sheet de criação sobe da base, tem drag handle, botão X fecha
- [ ] Título "Nova categoria" em Cal Sans 28px (font-sans padrão do projeto)
- [ ] Campo de nome submete com Enter (comportamento nativo do `<form>`)
- [ ] `ConfirmRemoveCategoryDrawer` usa `DrawerPrimitive` com nova linguagem visual
- [ ] Título do drawer de exclusão exibe o nome da categoria em Cal Sans 28px
- [ ] Card de aviso "Esta ação não pode ser desfeita." visível
- [ ] Botão de exclusão vermelho (`--color-error`)
- [ ] Dark mode correto em ambos os drawers
- [ ] `npx tsc --noEmit` passa sem erros
