# Category Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the DataTable-based category detail page (`/category?id=...`) with a mobile-first card layout featuring a Hero Card, explicit edit/delete product rows, and a sticky footer — following the EasyList.pen design and DESIGN.md tokens.

**Architecture:** Component-by-component replacement. Each new component is built in isolation and committed before the next. Everything is assembled in `CategoryClient` in the final task. Old DataTable files are deleted last. Design tokens are CSS variables in `globals.css`, referenced in Tailwind via arbitrary values (`bg-[var(--color-canvas)]`, etc.).

**Tech Stack:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, next-themes

**Spec:** `docs/superpowers/specs/2026-06-05-category-page-redesign.md`

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| New | `src/components/category-hero-card.tsx` | Hero card: breadcrumb, title, stat pills, category selector |
| New | `src/components/group-header.tsx` | Section header with count badge |
| New | `src/components/product-row.tsx` | Product card row: pending/cart variants + explicit edit/delete actions |
| New | `src/components/state-card.tsx` | Empty and error state cards |
| New | `src/components/sticky-footer.tsx` | Totals row + "Adicionar produto" CTA |
| Modify | `src/app/globals.css` | Add design token CSS variables (`:root` + `.dark`) |
| Modify | `src/components/main-content.tsx` | `mt-16` → `mt-14` (header height changes from 64px to 56px) |
| Modify | `src/components/header.tsx` | Greeting + email + circular theme/logout buttons |
| Modify | `src/components/category-select.tsx` | Restyle as full-width card ("Lista atual" / name / chevron) |
| Modify | `src/components/product-manager-sheet.tsx` | Remove internal `DialogPrimitive.Trigger` for add mode |
| Modify | `src/app/category/category-client.tsx` | Full restructure with all new components |
| Modify | `src/app/category/page.tsx` | Remove `<MainContent>` wrapper and `<Footer />` |
| Delete | `src/components/product-list.tsx` | Replaced by `ProductRow` + `GroupHeader` |
| Delete | `src/components/product-table/columns.tsx` | Logic moved into `ProductRow` |
| Delete | `src/components/product-table/data-table.tsx` | No longer used |

---

### Task 1: Add design tokens + fix MainContent

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/main-content.tsx`

- [ ] **Step 1: Add design token CSS variables to globals.css**

Open `src/app/globals.css`. Find the existing `:root { ... }` block and add these variables inside it:

```css
--color-ink: #111111;
--color-canvas: #ffffff;
--color-surface-card: #f5f5f5;
--color-muted: #6b7280;
--color-hairline: #e5e7eb;
--color-primary: #111111;
--color-on-primary: #ffffff;
--color-success: #10b981;
--color-error: #ef4444;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

Find the existing `.dark { ... }` block and add these variables inside it:

```css
--color-ink: #ffffff;
--color-canvas: #101010;
--color-surface-card: #1a1a1a;
--color-muted: #a1a1aa;
--color-hairline: #27272a;
--color-primary: #ffffff;
--color-on-primary: #111111;
```

(Success and error colors stay the same in both modes — no `.dark` override needed.)

- [ ] **Step 2: Update MainContent top margin**

The new Header is 56px tall (`h-14`). `src/components/main-content.tsx` currently uses `mt-16` (64px). Change it to `mt-14`:

```tsx
export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" className="p-4 flex flex-col gap-4 w-full mt-14 pb-28">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify no build errors**

```bash
npm run dev
```

Open any page. Confirm no terminal errors. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/main-content.tsx
git commit -m "feat: add design tokens and fix MainContent margin"
```

---

### Task 2: Redesign Header

**Files:**
- Modify: `src/components/header.tsx`

The current header is `h-16` (64px), fixed, shows avatar + username + ThemeToggle + logout button. Replace with a new `h-14` (56px) header showing "Olá, [firstName]" + email + two circular buttons.

- [ ] **Step 1: Rewrite header.tsx**

Replace the entire content of `src/components/header.tsx`:

```tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const firstName =
    session?.user?.name?.split(' ')[0] ??
    session?.user?.email?.split('@')[0] ??
    '';
  const email = session?.user?.email ?? '';

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between h-14 px-3 bg-[var(--color-canvas)] border-b border-[var(--color-hairline)] max-w-3xl mx-auto">
      {/* Left: avatar placeholder + greeting */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] border border-[var(--color-hairline)] flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold leading-none text-[var(--color-ink)]">
            Olá, {firstName}
          </span>
          <span className="text-[11px] leading-none text-[var(--color-muted)]">
            {email}
          </span>
        </div>
      </div>

      {/* Right: theme toggle + logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] flex items-center justify-center"
          aria-label="Alternar tema"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-[var(--color-ink)]" />
            : <Moon className="w-4 h-4 text-[var(--color-ink)]" />}
        </button>

        <button
          onClick={() => signOut()}
          className="w-9 h-9 rounded-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] flex items-center justify-center"
          aria-label="Sair"
        >
          <LogOut className="w-4 h-4 text-[var(--color-ink)]" />
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Open any authenticated page. Verify:
- Header shows "Olá, [name]" + email on the left
- Two circular buttons (moon/sun + logout) on the right
- Header background and icons switch correctly in dark mode
- No TypeScript errors in terminal

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat: redesign header with greeting, email, and circular action buttons"
```

---

### Task 3: Create GroupHeader

**Files:**
- Create: `src/components/group-header.tsx`

Full-width horizontal row: section title on the left, count badge (dark pill with white number) on the right.

- [ ] **Step 1: Create the file**

```tsx
interface GroupHeaderProps {
  title: string;
  count: number;
}

export function GroupHeader({ title, count }: GroupHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-base font-semibold text-[var(--color-ink)]">
        {title}
      </span>
      <div className="flex items-center justify-center w-7 h-6 rounded-full bg-[var(--color-primary)]">
        <span className="text-[12px] font-semibold text-[var(--color-on-primary)]">
          {count}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/group-header.tsx
git commit -m "feat: add GroupHeader component"
```

---

### Task 4: Modify CategorySelect

**Files:**
- Modify: `src/components/category-select.tsx`

Replace the current shadcn `<Select>` with a custom trigger styled as a full-width card (64px, "Lista atual" label + category name + chevron). The shadcn Select is kept for its dropdown behavior — only the trigger appearance changes.

`[&>svg]:hidden` in the trigger class hides the default chevron that shadcn adds automatically.

- [ ] **Step 1: Rewrite category-select.tsx**

```tsx
'use client';

import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useCategories } from '@/context';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
} from '@/components/ui/select';

export function CategorySelect() {
  const router = useRouter();
  const { categories, selectedCategoryId, setSelectedCategoryId } = useCategories();

  const selectedName =
    categories.find(c => c._id === selectedCategoryId)?.name ?? '';

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    router.push(`/category?id=${value}`);
  };

  return (
    <Select value={selectedCategoryId || ''} onValueChange={handleCategoryChange}>
      <SelectTrigger className="h-16 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] px-[14px] py-[13px] flex justify-between items-center [&>svg]:hidden w-full">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[10px] font-semibold leading-none text-[var(--color-muted)]">
            Lista atual
          </span>
          <span className="text-[14px] font-semibold leading-none text-[var(--color-ink)]">
            {selectedName}
          </span>
        </div>
        <ChevronDown className="w-[18px] h-[18px] text-[var(--color-ink)] shrink-0" />
      </SelectTrigger>

      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category._id} value={category._id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/category-select.tsx
git commit -m "feat: restyle CategorySelect as full-width card trigger"
```

---

### Task 5: Create CategoryHeroCard

**Files:**
- Create: `src/components/category-hero-card.tsx`

Vertical card (`rounded-[--radius-xl]`, 16px padding, 12px gap) containing: breadcrumb, 28px title, subtitle, two stat pills, and the `CategorySelect` card.

`StatPill` is a local sub-component — it is only used inside this card, so no separate file is needed.

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useRouter } from 'next/navigation';

import { CategoryProps, ProductProps } from '@/types/interfaces';

import { CategorySelect } from './category-select';

interface StatPillProps {
  value: number;
  label: string;
}

function StatPill({ value, label }: StatPillProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--color-surface-card)] px-2 py-1.5 w-full">
      <span className="text-[13px] font-semibold text-[var(--color-ink)]">{value}</span>
      <span className="text-[12px] font-medium text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

interface CategoryHeroCardProps {
  category: CategoryProps;
  products: ProductProps[];
}

export function CategoryHeroCard({ category, products }: CategoryHeroCardProps) {
  const router = useRouter();

  const pendingCount = products.filter(p => !p.addToCart).length;
  const cartCount = products.filter(p => p.addToCart).length;
  const totalCount = products.length;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => router.push('/')}
          className="text-[12px] font-semibold text-[var(--color-ink)]"
        >
          Home
        </button>
        <span className="text-[12px] text-[var(--color-muted)]">/</span>
        <span className="text-[12px] font-semibold text-[var(--color-muted)]">
          {category.name}
        </span>
      </div>

      {/* Hero title — Inter 600 with negative tracking (Cal Sans substitute) */}
      <h1
        className="text-[28px] font-semibold text-[var(--color-ink)]"
        style={{ letterSpacing: '-0.5px' }}
      >
        {category.name}
      </h1>

      {/* Subtitle */}
      <p className="text-[13px] font-medium text-[var(--color-muted)]">
        {totalCount} produto{totalCount !== 1 ? 's' : ''} nesta lista
      </p>

      {/* Stat pills */}
      <div className="flex flex-col gap-2 w-full">
        <StatPill value={pendingCount} label="pendentes" />
        <StatPill value={cartCount} label="no carrinho" />
      </div>

      {/* Category selector */}
      <CategorySelect />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/category-hero-card.tsx
git commit -m "feat: add CategoryHeroCard with breadcrumb, stats, and inline selector"
```

---

### Task 6: Create ProductRow

**Files:**
- Create: `src/components/product-row.tsx`

Single component with `variant: 'pending' | 'cart'`. It renders explicit toggle, edit, and delete actions; the implemented PR does not use swipe-to-delete.

**Delete behavior:**
- The delete button is always visible as a 34px circular icon button.
- Clicking delete sets local `isDeleting` and calls `onDelete(product._id)`.
- Edit/delete actions are disabled while this product is loading or being deleted.

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';

import { UnitEnum } from '@/types/enums';
import { ProductProps } from '@/types/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateProductValue } from '@/utils';

interface ProductRowProps {
  product: ProductProps;
  variant: 'pending' | 'cart';
  onToggleCart: (id: string) => void;
  onEdit: (product: ProductProps) => void;
  onDelete: (id: string) => void;
  isProductLoading: { productId: string | null; isLoading: boolean };
}

export function ProductRow({
  product,
  variant,
  onToggleCart,
  onEdit,
  onDelete,
  isProductLoading,
}: ProductRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isPending = variant === 'pending';
  const isThisLoading =
    isProductLoading.isLoading && isProductLoading.productId === product._id;

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(product._id!);
  };

  const metadata = calculateProductValue({
    price: String(product.price ?? ''),
    unit: product.unit as UnitEnum,
    quantity: String(product.quantity ?? ''),
  });

  return (
    <div
      className={[
        'flex items-center gap-3 h-[68px]',
        'border border-[var(--color-hairline)] rounded-[var(--radius-lg)]',
        'px-3 py-[10px]',
        isPending
          ? 'bg-[var(--color-canvas)]'
          : 'bg-[var(--color-surface-card)]',
      ].join(' ')}
      style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 200ms ease' }}
    >
      {/* Checkbox / skeleton while loading */}
        {isThisLoading ? (
          <Skeleton className="w-[34px] h-[34px] rounded-full flex-shrink-0" />
        ) : (
          <button
            onClick={() => onToggleCart(product._id!)}
            className={[
              'w-[34px] h-[34px] rounded-full flex-shrink-0',
              'flex items-center justify-center border-2',
              isPending
                ? 'bg-[var(--color-canvas)] border-[var(--color-hairline)]'
                : 'bg-[var(--color-primary)] border-[var(--color-primary)]',
            ].join(' ')}
            aria-label={isPending ? 'Adicionar ao carrinho' : 'Remover do carrinho'}
          >
            {!isPending && (
              <Check className="w-[18px] h-[18px] text-[var(--color-on-primary)]" />
            )}
          </button>
        )}

        {/* Product name + metadata */}
        <div className="flex flex-col gap-[3px] flex-1 min-w-0">
          <span
            className={[
              'text-[15px] font-semibold truncate',
              isPending
                ? 'text-[var(--color-ink)]'
                : 'text-[var(--color-muted)]',
            ].join(' ')}
          >
            {product.name}
          </span>
          {metadata && (
            <span className="text-[12px] text-[var(--color-muted)] truncate">
              {metadata}
            </span>
          )}
        </div>

      <div className="flex h-[34px] items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(product)}
          disabled={isThisLoading || isDeleting}
          className="w-[34px] h-[34px] rounded-full bg-[var(--color-surface-card)] flex items-center justify-center disabled:opacity-50"
          aria-label="Editar produto"
        >
          <Pencil className="w-[15px] h-[15px] text-[var(--color-ink)]" />
        </button>

        <button
          onClick={handleDelete}
          disabled={isThisLoading || isDeleting}
          className="w-[34px] h-[34px] rounded-full bg-[var(--color-surface-card)] flex items-center justify-center disabled:opacity-50"
          aria-label="Excluir produto"
        >
          <Trash2 className="w-[15px] h-[15px] text-[var(--color-error)]" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/product-row.tsx
git commit -m "feat: add ProductRow with pending/cart variants and explicit actions"
```

---

### Task 7: Create StateCard

**Files:**
- Create: `src/components/state-card.tsx`

Two variants: `empty` (package-plus icon, success color, add CTA) and `error` (triangle-alert icon, error color, navigate home CTA).

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { PackagePlus, TriangleAlert } from 'lucide-react';

interface StateCardProps {
  variant: 'empty' | 'error';
  onAdd?: () => void;
}

export function StateCard({ variant, onAdd }: StateCardProps) {
  const router = useRouter();
  const isEmpty = variant === 'empty';

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] border border-[var(--color-hairline)] p-3">
      {isEmpty
        ? <PackagePlus className="w-5 h-5 text-[var(--color-success)]" />
        : <TriangleAlert className="w-5 h-5 text-[var(--color-error)]" />}

      <p className="text-[12px] font-semibold text-[var(--color-ink)]">
        {isEmpty
          ? 'Nenhum produto nesta categoria ainda.'
          : 'Não encontramos essa categoria.'}
      </p>

      <button
        onClick={isEmpty ? onAdd : () => router.push('/')}
        className="text-[12px] font-semibold text-[var(--color-ink)] text-left"
      >
        {isEmpty ? 'Adicionar primeiro produto' : 'Voltar para Home'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/state-card.tsx
git commit -m "feat: add StateCard for empty and error states"
```

---

### Task 8: Create StickyFooter

**Files:**
- Create: `src/components/sticky-footer.tsx`

`calculateTotalValue(products)` returns `{ totalProductsValue: number, filteredProductsValue: number }` where `filteredProductsValue` is the total of cart items only. `convertToCurrency(value)` formats a number as `R$ X,XX`.

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { Plus } from 'lucide-react';

import { ProductProps } from '@/types/interfaces';
import { calculateTotalValue, convertToCurrency } from '@/utils';

interface StickyFooterProps {
  products: ProductProps[];
  onAddProduct: () => void;
}

export function StickyFooter({ products, onAddProduct }: StickyFooterProps) {
  const { totalProductsValue, filteredProductsValue } =
    calculateTotalValue(products);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 p-3 max-w-3xl mx-auto">
      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-3">
        {/* Totals row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold text-[var(--color-muted)]">
              Total
            </span>
            <span className="text-[12px] font-medium text-[var(--color-muted)]">
              Carrinho: {convertToCurrency(filteredProductsValue)}
            </span>
          </div>
          <span className="text-[22px] font-semibold text-[var(--color-ink)]">
            {convertToCurrency(totalProductsValue)}
          </span>
        </div>

        {/* Add product button */}
        <button
          onClick={onAddProduct}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-[var(--radius-md)] bg-[var(--color-primary)]"
        >
          <Plus className="w-[18px] h-[18px] text-[var(--color-on-primary)]" />
          <span className="text-[14px] font-semibold text-[var(--color-on-primary)]">
            Adicionar produto
          </span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sticky-footer.tsx
git commit -m "feat: add StickyFooter with totals and add-product CTA"
```

---

### Task 9: Remove internal FAB trigger from ProductManagerSheet

**Files:**
- Modify: `src/components/product-manager-sheet.tsx`

The sheet currently renders an `ActionButton` FAB internally when `type === add` (lines 137–141). In the new design, the sheet is always opened externally via the `open` prop. Remove the internal trigger.

- [ ] **Step 1: Remove the DialogPrimitive.Trigger block**

In `src/components/product-manager-sheet.tsx`, find and delete these 5 lines:

```tsx
      {type === AddOrEditProductTypeEnum.add && (
        <DialogPrimitive.Trigger asChild>
          <ActionButton icon={CirclePlus} />
        </DialogPrimitive.Trigger>
      )}
```

- [ ] **Step 2: Check remaining imports**

`CirclePlus` is still used at line 271 (`icon={type === AddOrEditProductTypeEnum.edit ? Edit : CirclePlus}`). Keep the import. No changes to imports needed.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/product-manager-sheet.tsx
git commit -m "refactor: remove internal FAB trigger from ProductManagerSheet"
```

---

### Task 10: Assemble CategoryClient + update page.tsx

**Files:**
- Modify: `src/app/category/category-client.tsx`
- Modify: `src/app/category/page.tsx`

`CategoryClient` is fully rewritten. `page.tsx` removes `<MainContent>` and `<Footer />` — the footer is now `StickyFooter` inside `CategoryClient`, and `MainContent` is replaced with an inline div using `mt-14` to match the new 56px header.

- [ ] **Step 1: Rewrite category-client.tsx**

Replace the entire file:

```tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { useCategories, useProducts } from '@/context';
import { ProductProps } from '@/types/interfaces';
import { AddOrEditProductTypeEnum } from '@/types/enums';
import { Skeleton } from '@/components/ui/skeleton';

import { StateCard } from '@/components/state-card';
import { GroupHeader } from '@/components/group-header';
import { ProductRow } from '@/components/product-row';
import { StickyFooter } from '@/components/sticky-footer';
import { CategoryHeroCard } from '@/components/category-hero-card';
import { ProductManagerSheet } from '@/components/product-manager-sheet';

export function CategoryClient() {
  const searchParams = useSearchParams();
  const { setSelectedCategoryId, filteredCategory, isLoadingCategories } = useCategories();
  const { removeProduct, toggleCart, isProductLoading } = useProducts();

  const categoryId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps>({} as ProductProps);

  useEffect(() => {
    if (!categoryId) return;
    setSelectedCategoryId(categoryId);
    setIsLoading(false);
  }, [categoryId, setSelectedCategoryId]);

  const handleEditProduct = (product: ProductProps) => {
    setSelectedProduct(product);
    setEditSheetOpen(true);
  };

  const { productsNotInCart, productsInCart } = useMemo(() => {
    const all = filteredCategory?.products ?? [];
    const sorted = [...all].sort((a, b) =>
      (a.name ?? '').toLowerCase().localeCompare(
        (b.name ?? '').toLowerCase(),
        'pt-BR'
      )
    );
    return {
      productsNotInCart: sorted.filter(p => !p.addToCart),
      productsInCart: sorted.filter(p => p.addToCart),
    };
  }, [filteredCategory?.products]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-[140px]">
        <Skeleton className="h-[220px] w-full rounded-[var(--radius-xl)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  // Error state — invalid category ID
  if (!filteredCategory && !isLoadingCategories) {
    return <StateCard variant="error" />;
  }

  if (!filteredCategory) return null;

  const allProducts = filteredCategory.products ?? [];

  return (
    <>
      <div className="flex flex-col gap-4 pb-[140px]">
        <CategoryHeroCard
          category={filteredCategory}
          products={allProducts}
        />

        {allProducts.length === 0 && (
          <StateCard variant="empty" onAdd={() => setAddSheetOpen(true)} />
        )}

        {productsNotInCart.length > 0 && (
          <>
            <GroupHeader
              title="Fora do carrinho"
              count={productsNotInCart.length}
            />
            {productsNotInCart.map(p => (
              <ProductRow
                key={p._id}
                product={p}
                variant="pending"
                onToggleCart={toggleCart}
                onEdit={handleEditProduct}
                onDelete={removeProduct}
                isProductLoading={isProductLoading}
              />
            ))}
          </>
        )}

        {productsInCart.length > 0 && (
          <>
            <GroupHeader
              title="Carrinho"
              count={productsInCart.length}
            />
            {productsInCart.map(p => (
              <ProductRow
                key={p._id}
                product={p}
                variant="cart"
                onToggleCart={toggleCart}
                onEdit={handleEditProduct}
                onDelete={removeProduct}
                isProductLoading={isProductLoading}
              />
            ))}
          </>
        )}
      </div>

      <StickyFooter
        products={allProducts}
        onAddProduct={() => setAddSheetOpen(true)}
      />

      <ProductManagerSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        type={AddOrEditProductTypeEnum.add}
      />

      <ProductManagerSheet
        open={editSheetOpen}
        product={selectedProduct}
        onOpenChange={setEditSheetOpen}
        type={AddOrEditProductTypeEnum.edit}
      />
    </>
  );
}
```

- [ ] **Step 2: Update page.tsx**

Replace the entire content of `src/app/category/page.tsx`:

```tsx
'use client';

import { Suspense } from 'react';

import { Main } from '@/components/main';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';

import { CategoryClient } from './category-client';

function CategorySkeleton() {
  return (
    <div className="w-full space-y-2 mt-14 p-4">
      <Skeleton className="h-9 w-28" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function Category() {
  return (
    <Main>
      <Header />

      <div className="w-full mt-14 p-4">
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryClient />
        </Suspense>
      </div>
    </Main>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Full flow verification**

```bash
npm run dev
```

Navigate to `/category?id=[valid-id]`. Verify each behavior:

| Behavior | Expected |
|---|---|
| Hero Card | Shows category name, product counts, stat pills, category selector |
| Category selector | Switching category navigates to that category |
| Breadcrumb "Home" | Navigates to `/` |
| Fora do carrinho section | Shows pending products with empty circle checkbox |
| Carrinho section | Shows cart products with filled black checkbox + muted text |
| Tap checkbox (pending row) | Product moves to Carrinho section, stat pills update |
| Tap checkbox (cart row) | Product moves back to Fora do carrinho |
| Tap trash icon | Product is removed from list |
| Product loading/deleting | Edit and delete actions are disabled and row opacity reflects pending deletion |
| Tap edit (✏️) | Edit sheet opens with product data pre-filled |
| Tap "Adicionar produto" | Add sheet opens |
| Sticky footer totals | Total and Carrinho values match product data |
| Dark mode toggle | All tokens switch correctly |
| Invalid category ID | Error StateCard shows "Não encontramos essa categoria." |
| Category with no products | Empty StateCard shows "Nenhum produto nesta categoria ainda." |

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/category/category-client.tsx src/app/category/page.tsx
git commit -m "feat: assemble redesigned CategoryClient with all new components"
```

---

### Task 11: Delete old files

**Files:**
- Delete: `src/components/product-list.tsx`
- Delete: `src/components/product-table/columns.tsx`
- Delete: `src/components/product-table/data-table.tsx`

- [ ] **Step 1: Verify no remaining imports**

```powershell
Select-String -Path "src/**/*.tsx","src/**/*.ts" -Pattern "product-list|product-table" -Recurse
```

Expected: zero results. If any file still imports these, fix that file before continuing.

- [ ] **Step 2: Delete the files**

```powershell
Remove-Item src/components/product-list.tsx
Remove-Item src/components/product-table/columns.tsx
Remove-Item src/components/product-table/data-table.tsx
```

- [ ] **Step 3: Verify build is clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

```bash
npm run dev
```

Navigate to `/category?id=[valid-id]`. Confirm page still works correctly. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove DataTable and ProductsList replaced by ProductRow"
```
