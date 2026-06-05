# Category Page Redesign — Spec

**Date:** 2026-06-05  
**Route:** `/category?id=...`  
**Source design:** `EasyList.pen` — frames `b397K` (light), `aPIpx` (dark), `r2Tvm1` (states), `m58G8L` (components)  
**Design system:** `DESIGN.md` (Cal.com-inspired, Cal Sans / Inter, white canvas, black primary)  
**Approach:** Component-by-component replacement (Abordagem 1)

---

## Overview

The current category detail page uses a `DataTable` (TanStack Table) with table headers and a trash-icon delete column. The redesign replaces it with a mobile-first card layout: a Hero Card contextualizing the category, clean product rows with swipe-to-delete, and a sticky footer with totals and a primary CTA. Dark mode is implemented in the same pass.

---

## Design Tokens

New CSS variables added to `src/app/globals.css` under `:root` and `.dark`:

| Token | Light | Dark |
|---|---|---|
| `--color-ink` | `#111111` | `#ffffff` |
| `--color-canvas` | `#ffffff` | `#101010` |
| `--color-surface-card` | `#f5f5f5` | `#1a1a1a` |
| `--color-muted` | `#6b7280` | `#a1a1aa` |
| `--color-hairline` | `#e5e7eb` | `#27272a` |
| `--color-primary` | `#111111` | `#ffffff` |
| `--color-on-primary` | `#ffffff` | `#111111` |
| `--color-success` | `#10b981` | `#10b981` |
| `--color-error` | `#ef4444` | `#ef4444` |
| `--radius-md` | `8px` | — |
| `--radius-lg` | `12px` | — |
| `--radius-xl` | `16px` | — |
| `--radius-full` | `9999px` | — |

**Cal Sans:** Cal Sans is a proprietary font not available publicly. Use Inter 600 with `letter-spacing: -0.04em` as the display font throughout (per DESIGN.md fallback guidance). No `@font-face` needed.

**Tailwind integration:** the new CSS variables follow the same pattern as shadcn/ui's existing tokens in `globals.css` (plain hex values, not `hsl()`). Reference them in Tailwind via arbitrary values: `text-[var(--color-ink)]`, `bg-[var(--color-canvas)]`, etc. No changes to `tailwind.config.ts` required.

---

## Components

### 1. `src/components/header.tsx` — Modified

**Design ref:** `Component/App Header` (`OopZ6`)

Current header is replaced with:

- **Height:** 56px, white canvas background, `rounded-[--radius-lg]`, hairline border
- **Left:** Avatar circle (36×36, `surface-card` fill, hairline border) + vertical stack: greeting ("Olá, [firstName]" — Inter 13px 600 ink) + email (Inter 11px normal muted)
- **Right:** Two circular icon buttons (36×36, canvas fill, hairline border, `rounded-full`):
  - Theme toggle — `sun` / `moon` Lucide icon, calls `setTheme` from `next-themes`
  - Logout — `log-out` Lucide icon, calls `signOut`
- **Data:** `firstName` and `email` read from `session.user` via `useSession()`. `firstName` is derived from `session.user.name?.split(' ')[0]`.

---

### 2. `src/components/category-hero-card.tsx` — New

**Design ref:** `Component/Category Hero Card` (`E1xhtT`)

Vertical card, `rounded-[--radius-xl]`, canvas fill, hairline border, padding 16px, gap 12px.

**Children (top to bottom):**
1. **Breadcrumb** — inline: "Home" (Inter 12px 600 ink, clickable → `router.push('/')`) + "/" separator (muted) + category name (Inter 12px 600 muted). No external component needed.
2. **Hero Title** — category name in Cal Sans 28px 600, `color-ink`, `letter-spacing: -0.5px`
3. **Hero Subtitle** — "X produtos nesta lista" — Inter 13px 500 muted
4. **Stat Pills row** — vertical stack, gap 8px, full width:
   - Pill: `[pendentes count] pendentes` — pill shape (`rounded-full`), `surface-card` bg, padding `6px 8px`
   - Pill: `[carrinho count] no carrinho` — same style
   - Each pill: value (Inter 13px 600 ink) + label (Inter 12px 500 muted), horizontal layout gap 2px
5. **Category Selector** — redesigned `CategorySelect` (see below), embedded here

**Props:** `category: CategoryProps`, `products: ProductProps[]`  
**Derived:** `pendingCount = products.filter(p => !p.addToCart).length`, `cartCount = products.filter(p => p.addToCart).length`

---

### 3. `src/components/category-select.tsx` — Modified

**Design ref:** `Component/Category Selector` (`OjCJ3`)

Replaces the current shadcn `Select` dropdown. New appearance: full-width card, 64px height, `rounded-[--radius-md]`, canvas fill, hairline border, padding `13px 14px`, horizontal layout space-between.

- **Left:** vertical stack — "Lista atual" (Inter 10px 600 muted) + selected category name (Inter 14px 600 ink)
- **Right:** `chevron-down` Lucide icon 18×18 ink

Still uses shadcn `Select` internally (trigger is now the custom card, content remains the dropdown list). Same logic: `onValueChange` calls `setSelectedCategoryId` + `router.push`.

---

### 4. `src/components/group-header.tsx` — New

**Design ref:** `Component/Group Header` (`GKBnw`)

Full-width horizontal row, space-between.

- **Left:** section title (Inter 16px 600 ink)
- **Right:** count badge — 24×28px pill (`rounded-full`), `color-primary` fill, count number (Inter 12px 600 `on-primary`)

**Props:** `title: string`, `count: number`

---

### 5. `src/components/product-row.tsx` — New

**Design ref:** `Component/Product Row Pending` (`G89kV2`), `Component/Product Row Cart` (`b0MS8o`)

Single component with a `variant: 'pending' | 'cart'` prop.

**Layout:** full-width, height 68px, `rounded-[--radius-lg]`, hairline border, padding `10px 12px`, horizontal gap 12px, `alignItems: center`.

- **variant `pending`:** canvas fill, ink text
- **variant `cart`:** `surface-card` fill, muted text (both name and metadata)

**Children:**
- **Checkbox** (34×34, `rounded-full`):
  - `pending`: canvas fill, 2px hairline border — empty circle
  - `cart`: `color-primary` fill + stroke, white `check` Lucide icon 18×18 centered
  - `onClick`: calls `toggleCart(product._id)`
  - While `isProductLoading.productId === product._id`: shows `Skeleton` instead
- **Product Copy** (fill, vertical gap 3px):
  - Name: Inter 15px 600, ink (pending) / muted (cart)
  - Metadata: formatted string `[quantity] [unit] · R$ [price]` — Inter 12px normal muted
- **Edit button** (34×34, `rounded-full`, `surface-card` fill):
  - `pencil` Lucide icon 15×15 ink
  - `onClick`: calls `onEdit(product)` prop → opens `ProductManagerSheet`

**Swipe-to-delete (see Section 6).**

---

### 6. Swipe-to-Delete on `ProductRow`

**Library:** `@use-gesture/react` (`useDrag` hook)

**Structure:** two-layer wrapper inside `ProductRow`:

```
<div style={{ position: 'relative', overflow: 'hidden' }}>
  {/* Delete zone — fixed behind, 72px wide, right-aligned */}
  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 72 }}>
    🗑️ button
  </div>
  {/* Row content — slides left on drag */}
  <div style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : 'transform 200ms ease' }}>
    ... row content ...
  </div>
</div>
```

**Gesture logic (`useDrag`):**
- `dx` clamped to `[-72, 0]` (no rightward drag, no over-swipe left)
- On drag end:
  - `dx > -56` → snap back to 0
  - `dx ≤ -56` → snap to -72 (delete zone fully revealed)
- Only one row open at a time: `CategoryClient` holds `openSwipeId: string | null`; opening a new row resets the previous

**Delete action:**
- Tap 🗑️: animate row `translateX(-100%)` + collapse height to 0 over 200ms → then call `removeProduct(id)`
- Row disabled (opacity 50%, pointer-events none) while `isProductLoading.productId === id`

**Close on outside tap:**
- `CategoryClient` listens for clicks on the scroll container; if `openSwipeId` is set and click target is not inside that row, snaps it closed

---

### 7. `src/components/state-card.tsx` — New

**Design ref:** `Component/State Card Empty` (`X5nIEI`), `Component/State Card Error` (`IUYdo`)

Single component with `variant: 'empty' | 'error'` prop.

`rounded-[--radius-lg]`, `surface-card` fill, hairline border, padding 12px, vertical gap 8px.

| Field | `empty` | `error` |
|---|---|---|
| Icon | `package-plus` (Lucide, success color) | `triangle-alert` (Lucide, error color) |
| Message | "Nenhum produto nesta categoria ainda." | "Não encontramos essa categoria." |
| CTA text | "Adicionar primeiro produto" | "Voltar para Home" |
| CTA action | Opens `ProductManagerSheet` (add mode) | `router.push('/')` |

Both text nodes: Inter 12px 600 ink. CTA is a plain text button (no background), same style.

---

### 8. `src/components/sticky-footer.tsx` — New

**Design ref:** `Component/Sticky Footer Summary` (`o5ht8`) + `Component/Add Product Button` (`tAWn1`)

Sticky bottom card: `rounded-[--radius-xl]`, canvas fill, hairline border, padding 12px, vertical gap 12px. Positioned with `fixed bottom-0 left-0 right-0 z-10 p-4`.

**Totals row** (space-between):
- Left stack (gap 2px):
  - "Total" — Inter 12px 600 muted
  - "Carrinho: R$ [cartTotal]" — Inter 12px 500 muted
- Right: total value — Inter 22px 600 ink

**Add Product button** (full-width, height 48px, `rounded-[--radius-md]`, `color-primary` fill):
- `plus` icon 18×18 `on-primary` + "Adicionar produto" Inter 14px 600 `on-primary`
- `onClick`: opens `ProductManagerSheet` in add mode

**Totals calculation:**
- `totalGeral`: sum of `calculateProductValue` across all products in category
- `cartTotal`: sum across products where `addToCart === true`
- Both formatted via existing `formatCurrency` util

**Props:** `products: ProductProps[]`, `onAddProduct: () => void`

**Note on `ProductManagerSheet` trigger:** the current sheet renders an internal `ActionButton` FAB when `type === add`. In the new design, the sheet is opened externally via the `StickyFooter` button — controlled via `open` / `onOpenChange` props. The internal `ActionButton` trigger in `ProductManagerSheet` must be removed (the `DialogPrimitive.Trigger` block for `add` type). The `open` prop already supports external control.

---

## Page Assembly — `category-client.tsx`

`CategoryClient` is restructured as follows:

```
<main className="flex flex-col gap-4 pb-[140px]">        ← pb clears sticky footer
  <CategoryHeroCard category={filteredCategory} products={filteredCategory.products} />

  {products.length === 0 && <StateCard variant="empty" onAdd={openAddSheet} />}

  {productsNotInCart.length > 0 && (
    <>
      <GroupHeader title="Fora do carrinho" count={productsNotInCart.length} />
      {productsNotInCart.map(p => (
        <ProductRow key={p._id} product={p} variant="pending"
          openSwipeId={openSwipeId} onSwipeOpen={setOpenSwipeId}
          onToggleCart={toggleCart} onEdit={openEditSheet}
          isLoading={isProductLoading} onDelete={removeProduct} />
      ))}
    </>
  )}

  {productsInCart.length > 0 && (
    <>
      <GroupHeader title="Carrinho" count={productsInCart.length} />
      {productsInCart.map(p => (
        <ProductRow key={p._id} product={p} variant="cart" ... />
      ))}
    </>
  )}
</main>

<StickyFooter products={filteredCategory.products} onAddProduct={openAddSheet} />

<ProductManagerSheet open={editSheetOpen} ... />
```

**Error state:** if `!filteredCategory && !isLoadingCategories` → renders `<StateCard variant="error" />` instead of the full layout (no hero card, no footer).

**Loading state:** Hero Card and product rows show `Skeleton` placeholders while `isLoading`.

**`openSwipeId` state:** `useState<string | null>(null)` in `CategoryClient`. Passed down to each `ProductRow`. When a row opens its swipe zone, it calls `onSwipeOpen(product._id)`. Rows check if their id matches — if not, they snap closed.

---

## Files Deleted After Redesign

| File | Reason |
|---|---|
| `src/components/product-list.tsx` | Replaced by `ProductRow` + `GroupHeader` in `CategoryClient` |
| `src/components/product-table/columns.tsx` | Logic migrated into `ProductRow` |
| `src/components/product-table/data-table.tsx` | No longer used |

---

## Dark Mode

All new components use Tailwind's `dark:` variant alongside the CSS variables above. No JS logic. `next-themes` already manages the `dark` class on `<html>`. The theme toggle button in the new Header calls `setTheme('dark' | 'light')` — replacing the existing `ThemeToggle` component.

---

## Out of Scope

- Animation library for row collapse on delete (plain CSS transition is sufficient)
- Pagination or infinite scroll on product list
- Sorting/filtering UI beyond the existing `StatusEnum` filter
- `CategoryCard` (home page list) redesign
- Auth flow redesign
