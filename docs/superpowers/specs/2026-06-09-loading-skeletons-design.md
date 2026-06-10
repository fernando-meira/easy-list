# Loading Skeletons — Category List & Category Page

**Date:** 2026-06-09
**Branch:** feat/share-button-design
**Status:** Approved

## Problem

Two screens have no loading feedback while Firebase data loads:

- **Home (category list):** The skeleton code in `CategoryCard.renderContent` never fires. Sections are gated behind `length > 0` checks on arrays that are `undefined` during loading. The `HomeLoading` component exists but is never imported.
- **Category page (product list):** A local `isLoading` state resolves almost instantly (just calls `setSelectedCategoryId`). While Firebase is still fetching, `filteredCategory` is `null` and the component returns `null` — blank screen.

## Decisions

- **Approach:** Dedicated skeleton components (clean, isolated, mirrors design file).
- **Skeleton color:** `bg-[var(--color-hairline)] animate-pulse` — matches the existing header pattern; adapts to dark mode automatically via CSS variable.
- **Hero card skeleton style:** Faithful structure (title lines, cart badge, stat pills, share button, selector) to reduce layout shift.
- **No changes to:** `ProductRow` per-item skeleton (action loading, not page loading), `ui/skeleton.tsx`.

## Architecture

### New files

**`src/components/category-list-skeleton.tsx`**
Skeleton for the home screen (category listing). Rendered by `CategoryCard` when `isLoadingCategories` is `true`, before any conditional section rendering.

**`src/components/category-page-skeleton.tsx`**
Skeleton for the category page (product listing). Rendered by `CategoryClient` when `isLoadingCategories && !filteredCategory`.

### Modified files

**`src/components/category-card.tsx`**
- Add early return: `if (isLoadingCategories) return <CategoryListSkeleton />`
- Remove dead `renderContent` skeleton branch (the `if (isLoadingCategories)` block inside `renderContent`)

**`src/app/category/category-client.tsx`**
- Replace the `if (!filteredCategory && !isLoadingCategories)` error state guard to also cover the loading state
- Replace the `return null` when `!filteredCategory` with `return <CategoryPageSkeleton />` when `isLoadingCategories` is true

### Deleted files

**`src/components/home-loading.tsx`** — orphaned component, never imported anywhere.

## Component Specs

### `CategoryListSkeleton`

All skeleton elements use `className="bg-[var(--color-hairline)] animate-pulse rounded-..."`.

```
Page title block        160 × 34px   rounded-lg
─ My Lists section ──────────────────────────────
  Section label         120 × 14px   rounded
  Sub-label "Atualizadas" 90 × 12px  rounded
  Category card ×2      w-full × 86px  rounded-xl
  Sub-label "Antigas"   60 × 12px    rounded
  Category card ×1      w-full × 86px  rounded-xl
─ Shared section ────────────────────────────────
  Section label         140 × 14px   rounded
  Shared card ×1        w-full × 56px  rounded-xl
─ Add button            160 × 40px   rounded-full
```

Wraps in `<main className="flex flex-col gap-4">` matching the real `CategoryCard` root.

### `CategoryPageSkeleton`

```
Breadcrumb              3 inline blocks (36 / 6 / 90px wide × 12px tall, rounded-sm)
─ Hero card (border var(--color-hairline), rounded-xl, p-[18px], gap-[14px]) ──
  Title line            190 × 28px   rounded-md
  Subtitle line         130 × 13px   rounded
  Cart badge            120 × 32px   rounded-full
  Stats row             2 × fill × 34px  rounded-full  (gap-[10px])
  Share button          w-full × 40px    rounded-md
  Category selector     w-full × 64px    rounded-md
─ Group header "Fora do carrinho"   120 × 14px   rounded
  Product row ×3        w-full × 68px    rounded-xl
─ Group header "Carrinho"           80 × 14px    rounded
  Product row ×2        w-full × 68px    rounded-xl
```

Wraps in `<div className="flex flex-col gap-4 pb-[140px]">` matching the real `CategoryClient` content root.

## Dark Mode

Both components use `var(--color-hairline)` which is already themed via CSS variable. No conditional dark mode logic needed.

## Out of Scope

- Updating `ui/skeleton.tsx` to standardize color (can be a follow-up)
- Skeleton for the sticky footer (footer is tied to category data; during loading it's not visible)
- Dark mode dedicated component variants in Pencil (light + dark screens created in design file for reference)
