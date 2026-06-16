# Category Collapsible Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Remove Grouping" icon button to `CategoryHeroCard` and make all list sections (main + subcategories) collapsible with animated expand/collapse.

**Architecture:** The remove-grouping flow adds one new `firestore-domain` function and one new Next.js API route. Collapsible state is managed locally in `category-client.tsx` via a `Set<string>` of collapsed section IDs, initialized with `"cart"` so the cart section starts collapsed. Animation uses the CSS `grid-rows` trick for smooth height transitions without JavaScript layout measurements.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, lucide-react, Firebase Admin SDK (`FieldValue.delete()`).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/firestore-domain.ts` | Modify | Export `removeGrouping(userId, categoryId)` |
| `src/app/api/categories/[id]/grouping/route.ts` | Create | `DELETE` handler — auth, call `removeGrouping`, return result |
| `src/components/subcategory-header.tsx` | Modify | Add `isCollapsed` + `onToggle` props, chevron icon |
| `src/components/section-header.tsx` | Create | Collapsible header for "Fora do carrinho" / "Carrinho" sections |
| `src/components/category-hero-card.tsx` | Modify | Replace full-width organize button with icon-only row; add conditional `ListX` button |
| `src/app/category/category-client.tsx` | Modify | Add `collapsedSections` state, `toggleSection`, `handleRemoveGrouping`, wire all collapsible wrappers |

---

## Task 1: Backend — `removeGrouping` function

**Files:**
- Modify: `src/lib/firestore-domain.ts`

- [ ] **Step 1: Add `removeGrouping` after `organizeList`**

Open `src/lib/firestore-domain.ts`. After the closing `}` of `organizeList` (currently the last function, line ~455), append:

```typescript
export async function removeGrouping(userId: string, categoryId: string): Promise<boolean> {
  const category = await getOwnedCategory(categoryId, userId);
  if (!category) return false;

  await categoriesCollection.doc(categoryId).update({
    updatedAt: FieldValue.serverTimestamp(),
    subcategoryOrder: FieldValue.delete(),
  });

  return true;
}
```

Note: `FieldValue.delete()` removes the field entirely from the Firestore document. `getOwnedCategory` (line ~69) is an internal helper that verifies ownership before returning. `FieldValue` is already imported at the top of the file.

- [ ] **Step 2: Verify type-check passes**

```bash
npm run build
```

Expected: build completes without TypeScript errors. If `FieldValue.delete()` causes a type error, cast as `FieldValue.delete() as unknown as string[]`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firestore-domain.ts
git commit -m "feat(backend): add removeGrouping function to firestore-domain"
```

---

## Task 2: Backend — DELETE API route

**Files:**
- Create: `src/app/api/categories/[id]/grouping/route.ts`

The directory `src/app/api/categories/[id]/` already exists (contains `share/route.ts`). Create a new `grouping/` subdirectory with a route file.

- [ ] **Step 1: Create the route file**

Create `src/app/api/categories/[id]/grouping/route.ts` with:

```typescript
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { removeGrouping } from '@/lib/firestore-domain';

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

    const success = await removeGrouping(userId, categoryId);

    if (!success) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao remover agrupamento' }, { status: 500 });
  }
}
```

Note: Uses `params: Promise<{ id: string }>` — the Next.js 15 App Router pattern used by every other dynamic route in this project (see `src/app/api/categories/[id]/share/route.ts`).

- [ ] **Step 2: Verify type-check passes**

```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/categories/[id]/grouping/route.ts
git commit -m "feat(api): add DELETE /api/categories/[id]/grouping route"
```

---

## Task 3: `SubcategoryHeader` — collapsible

**Files:**
- Modify: `src/components/subcategory-header.tsx`

- [ ] **Step 1: Rewrite `SubcategoryHeader` with collapsible props**

Replace the entire content of `src/components/subcategory-header.tsx` with:

```tsx
'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SubcategoryHeaderProps {
  count: number;
  title: string;
  onToggle: () => void;
  isCollapsed: boolean;
}

export function SubcategoryHeader({ title, count, isCollapsed, onToggle }: SubcategoryHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-1"
    >
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "h-3.5 w-3.5 text-[var(--color-muted)] transition-transform duration-200",
          isCollapsed && "-rotate-90"
        )}
      />
      <span className="text-[13px] font-semibold text-[var(--color-muted)]">{title}</span>
      <span className="text-[12px] font-medium text-[var(--color-muted)]">{count}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
npm run build
```

Expected: TypeScript error in `category-client.tsx` about missing props `isCollapsed` and `onToggle` on `<SubcategoryHeader>` — this is expected and will be fixed in Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/components/subcategory-header.tsx
git commit -m "feat(ui): make SubcategoryHeader collapsible with chevron toggle"
```

---

## Task 4: Create `SectionHeader` component

**Files:**
- Create: `src/components/section-header.tsx`

This component replaces the existing `GroupHeader` for the "Fora do carrinho" and "Carrinho" sections, adding click-to-collapse behavior while preserving the existing visual style.

- [ ] **Step 1: Create `src/components/section-header.tsx`**

```tsx
'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SectionHeaderProps {
  count: number;
  title: string;
  onToggle: () => void;
  isCollapsed: boolean;
}

export function SectionHeader({ title, count, isCollapsed, onToggle }: SectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between"
    >
      <span className="text-base font-semibold text-[var(--color-ink)]">{title}</span>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]">
          <span className="text-[12px] font-semibold text-[var(--color-on-primary)]">{count}</span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 text-[var(--color-muted)] transition-transform duration-200",
            isCollapsed && "-rotate-90"
          )}
        />
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
npm run build
```

Expected: build succeeds (component is not yet used — no import errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/section-header.tsx
git commit -m "feat(ui): add collapsible SectionHeader component"
```

---

## Task 5: `CategoryHeroCard` — icon-only action buttons

**Files:**
- Modify: `src/components/category-hero-card.tsx`

Replace the full-width "Organizar lista" button with an inline row of icon-only ghost buttons. Add a conditional `ListX` button for removing grouping.

- [ ] **Step 1: Update imports**

Replace the current lucide import line:
```typescript
import { Share2, Sparkles, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
```
with:
```typescript
import { ListX, Share2, Sparkles, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
```

- [ ] **Step 2: Update `CategoryHeroCardProps` interface**

Replace:
```typescript
interface CategoryHeroCardProps {
  isOrganizing?: boolean;
  category: CategoryProps;
  products: ProductProps[];
  onOrganize?: () => Promise<void>;
}
```
with:
```typescript
interface CategoryHeroCardProps {
  isOrganizing?: boolean;
  category: CategoryProps;
  products: ProductProps[];
  isRemovingGrouping?: boolean;
  onOrganize?: () => Promise<void>;
  onRemoveGrouping?: () => Promise<void>;
}
```

- [ ] **Step 3: Update function signature**

Replace:
```typescript
export function CategoryHeroCard({ isOrganizing, category, products, onOrganize }: CategoryHeroCardProps) {
```
with:
```typescript
export function CategoryHeroCard({ isOrganizing, category, products, isRemovingGrouping, onOrganize, onRemoveGrouping }: CategoryHeroCardProps) {
```

- [ ] **Step 4: Replace full-width organize button with icon-only row**

Find and replace the full-width organize `<Button>` block (inside `{!category.isShared && (...)}`, after the Share button):

Replace:
```tsx
            <Button
              variant="outline"
              onClick={onOrganize}
              disabled={isOrganizing || products.length < 2}
              className="h-10 w-full border-[var(--color-hairline)] bg-[var(--color-surface-card)] text-sm font-semibold text-[var(--color-ink)] shadow-none hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] disabled:opacity-50 [&_svg]:size-4"
            >
              {isOrganizing ? (
                <>
                  <LoadingSpinner size={16} />
                  Organizando...
                </>
              ) : (
                <>
                  <Sparkles aria-hidden="true" />
                  Organizar lista
                </>
              )}
            </Button>
```
with:
```tsx
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={onOrganize}
                aria-label="Organizar lista"
                disabled={isOrganizing || products.length < 2}
                className="h-8 w-8 disabled:opacity-50 [&_svg]:size-4"
              >
                {isOrganizing ? <LoadingSpinner size={14} /> : <Sparkles aria-hidden="true" />}
              </Button>

              {(category.subcategoryOrder?.length ?? 0) > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onRemoveGrouping}
                  aria-label="Remover agrupamento"
                  disabled={isRemovingGrouping}
                  className="h-8 w-8 disabled:opacity-50 [&_svg]:size-4"
                >
                  {isRemovingGrouping ? <LoadingSpinner size={14} /> : <ListX aria-hidden="true" />}
                </Button>
              )}
            </div>
```

- [ ] **Step 5: Verify type-check and lint**

```bash
npm run lint:fix
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/category-hero-card.tsx
git commit -m "feat(ui): replace organize button with icon-only action row in CategoryHeroCard"
```

---

## Task 6: `category-client.tsx` — wire state and collapsible sections

**Files:**
- Modify: `src/app/category/category-client.tsx`

This is the largest change: add collapse state, two new handlers, replace `GroupHeader` with `SectionHeader`, and wrap every product list section in the CSS grid collapsible pattern.

- [ ] **Step 1: Update imports**

Replace the entire imports block at the top of `src/app/category/category-client.tsx` with:

```typescript
'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useMemo, Fragment, useState, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { ProductProps } from '@/types/interfaces';
import { StateCard } from '@/components/state-card';
import { ProductRow } from '@/components/product-row';
import { useProducts, useCategories } from '@/context';
import { StickyFooter } from '@/components/sticky-footer';
import { SectionHeader } from '@/components/section-header';
import { CategoryHeroCard } from '@/components/category-hero-card';
import { UnitEnum, AddOrEditProductTypeEnum } from '@/types/enums';
import { SubcategoryHeader } from '@/components/subcategory-header';
import { BarcodeScannerSheet } from '@/components/barcode-scanner-sheet';
import { ProductManagerSheet } from '@/components/product-manager-sheet';
import { CategoryPageSkeleton } from '@/components/category-page-skeleton';
import { BarcodeLookupResult, BarcodeProductPreview } from '@/components/barcode-product-preview';
```

Note: `GroupHeader` is intentionally removed — replaced by `SectionHeader`.

- [ ] **Step 2: Add new state variables and reorder existing ones**

Find the block of `useState` declarations (starting around line 57) and replace it entirely with the staircase-ordered version that includes the two new variables:

```typescript
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [isBarcodeBusy, setIsBarcodeBusy] = useState(false);
  const [isRemovingGrouping, setIsRemovingGrouping] = useState(false);
  const [lookupResult, setLookupResult] = useState<BarcodeLookupResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductProps>({} as ProductProps);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['cart']));
  const [scannerInitialProduct, setScannerInitialProduct] = useState<Partial<ProductProps> | undefined>();
```

- [ ] **Step 3: Add `toggleSection` function**

After the `handleOrganize` function (around line 199), add:

```typescript
  function toggleSection(id: string) {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
```

- [ ] **Step 4: Add `handleRemoveGrouping` function**

Immediately after `toggleSection`, add:

```typescript
  const handleRemoveGrouping = async () => {
    if (!filteredCategory?._id || isRemovingGrouping) return;

    setIsRemovingGrouping(true);
    markLocalMutation(1);

    try {
      const response = await fetch(`/api/categories/${filteredCategory._id}/grouping`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('API error');

      toast.success('Agrupamento removido!');
    } catch {
      toast.error('Não foi possível remover o agrupamento. Tente novamente.');
    } finally {
      setIsRemovingGrouping(false);
    }
  };
```

- [ ] **Step 5: Update `CategoryHeroCard` props in JSX**

Find:
```tsx
        <CategoryHeroCard
          category={filteredCategory}
          products={allProducts}
          isOrganizing={isOrganizing}
          onOrganize={handleOrganize}
        />
```
Replace with:
```tsx
        <CategoryHeroCard
          category={filteredCategory}
          products={allProducts}
          isOrganizing={isOrganizing}
          onOrganize={handleOrganize}
          isRemovingGrouping={isRemovingGrouping}
          onRemoveGrouping={handleRemoveGrouping}
        />
```

- [ ] **Step 6: Replace "Fora do carrinho" section**

Find the entire `{productsNotInCart.length > 0 && (...)}` block and replace it with:

```tsx
        {productsNotInCart.length > 0 && (
          <>
            <SectionHeader
              title="Fora do carrinho"
              count={productsNotInCart.length}
              isCollapsed={collapsedSections.has('pending')}
              onToggle={() => toggleSection('pending')}
            />
            <div className={cn(
              'grid transition-all duration-200',
              collapsedSections.has('pending') ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
            )}>
              <div className="overflow-hidden">
                <div className="flex flex-col gap-4">
                  {subcategoryOrder
                    ? groupProductsBySubcategory(productsNotInCart, subcategoryOrder).map(group => (
                      <Fragment key={group.subcategory}>
                        <SubcategoryHeader
                          title={group.subcategory}
                          count={group.products.length}
                          isCollapsed={collapsedSections.has(`sub:${group.subcategory}`)}
                          onToggle={() => toggleSection(`sub:${group.subcategory}`)}
                        />
                        <div className={cn(
                          'grid transition-all duration-200',
                          collapsedSections.has(`sub:${group.subcategory}`) ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                        )}>
                          <div className="overflow-hidden">
                            <div className="flex flex-col gap-4">
                              {group.products.map(p => (
                                <ProductRow
                                  key={p._id}
                                  product={p}
                                  variant="pending"
                                  onEdit={handleEditProduct}
                                  onDelete={removeProduct}
                                  onToggleCart={toggleCart}
                                  isProductLoading={isProductLoading}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    ))
                    : productsNotInCart.map(p => (
                      <ProductRow
                        key={p._id}
                        product={p}
                        variant="pending"
                        onEdit={handleEditProduct}
                        onDelete={removeProduct}
                        onToggleCart={toggleCart}
                        isProductLoading={isProductLoading}
                      />
                    ))
                  }
                </div>
              </div>
            </div>
          </>
        )}
```

- [ ] **Step 7: Replace "Carrinho" section**

Find the entire `{productsInCart.length > 0 && (...)}` block and replace it with:

```tsx
        {productsInCart.length > 0 && (
          <>
            <SectionHeader
              title="Carrinho"
              count={productsInCart.length}
              isCollapsed={collapsedSections.has('cart')}
              onToggle={() => toggleSection('cart')}
            />
            <div className={cn(
              'grid transition-all duration-200',
              collapsedSections.has('cart') ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
            )}>
              <div className="overflow-hidden">
                <div className="flex flex-col gap-4">
                  {subcategoryOrder
                    ? groupProductsBySubcategory(productsInCart, subcategoryOrder).map(group => (
                      <Fragment key={group.subcategory}>
                        <SubcategoryHeader
                          title={group.subcategory}
                          count={group.products.length}
                          isCollapsed={collapsedSections.has(`sub:${group.subcategory}`)}
                          onToggle={() => toggleSection(`sub:${group.subcategory}`)}
                        />
                        <div className={cn(
                          'grid transition-all duration-200',
                          collapsedSections.has(`sub:${group.subcategory}`) ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                        )}>
                          <div className="overflow-hidden">
                            <div className="flex flex-col gap-4">
                              {group.products.map(p => (
                                <ProductRow
                                  key={p._id}
                                  product={p}
                                  variant="cart"
                                  onEdit={handleEditProduct}
                                  onDelete={removeProduct}
                                  onToggleCart={toggleCart}
                                  isProductLoading={isProductLoading}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    ))
                    : productsInCart.map(p => (
                      <ProductRow
                        key={p._id}
                        product={p}
                        variant="cart"
                        onEdit={handleEditProduct}
                        onDelete={removeProduct}
                        onToggleCart={toggleCart}
                        isProductLoading={isProductLoading}
                      />
                    ))
                  }
                </div>
              </div>
            </div>
          </>
        )}
```

- [ ] **Step 8: Lint and type-check**

```bash
npm run lint:fix
```

Expected: no errors.

- [ ] **Step 9: Manual smoke test**

Start the dev server:
```bash
npm run dev
```

Open the app and navigate to any category page. Verify:
1. "Fora do carrinho" section is **expanded** by default — products visible
2. "Carrinho" section is **collapsed** by default — products hidden
3. Clicking "Fora do carrinho" header collapses it smoothly (CSS grid animation)
4. Clicking "Carrinho" header expands it smoothly
5. When subcategoryOrder exists: subcategory headers show chevrons, clicking collapses that subcategory's products
6. In `CategoryHeroCard`: "Organizar lista" is now an icon-only ghost button (`Sparkles` icon)
7. When the list has `subcategoryOrder`: a second `ListX` icon button appears next to organize
8. Clicking `ListX` removes the grouping, toast "Agrupamento removido!" appears, list reverts to flat alphabetical display
9. After removing grouping, `ListX` button disappears (only `Sparkles` remains)

- [ ] **Step 10: Commit**

```bash
git add src/app/category/category-client.tsx
git commit -m "feat(ui): add collapsible sections and remove-grouping handler to CategoryClient"
```
