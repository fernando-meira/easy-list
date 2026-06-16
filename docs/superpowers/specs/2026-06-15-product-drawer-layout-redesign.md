# Product Drawer — Layout Redesign

**Date:** 2026-06-15
**Scope:** `responsive-product-dialog.tsx`, `product-manager-sheet.tsx`

---

## Goal

Two improvements to the product add/edit drawer on mobile:

1. Drawer height grows dynamically to fill the full available screen instead of being capped at 90dvh.
2. Form fields reordered to a new sequence, with subcategory unlocked for add mode.

---

## 1. Height Behavior

**File:** `src/components/responsive-product-dialog.tsx`

### Current

```
max-height: min(90dvh, calc(var(--product-dialog-available-height) - 16px))
```

### New

```css
min-height: 60dvh;
max-height: var(--product-dialog-available-height);
height: auto;
```

**What changes:**
- Removes the 90dvh cap and the 16px top gap.
- Adds `min-height: 60dvh` so the drawer never appears too short on sparse content. (This value may need minor calibration during implementation based on visual testing.)
- Uses the full `--product-dialog-available-height` (already computed by the existing `visualViewport` listener — no changes needed to that logic).

**What stays the same:**
- `visualViewport` resize/scroll/orientationchange listeners.
- `--product-dialog-available-height` and `--product-dialog-visual-offset-top` CSS variables.
- Drag handle pill.
- Sticky footer.
- `overflow-y-auto overscroll-contain` scroll behavior.

---

## 2. Field Order

**File:** `src/components/product-manager-sheet.tsx`

### Current order

| # | Field | Notes |
|---|---|---|
| 1 | Nome | Required text input |
| 2 | Categoria | CategoryPopover dropdown |
| 3 | Detalhes opcionais | Card: preço + qtd + unidade |
| 4 | Adicionar ao carrinho | CartToggleRow |
| 5 | Subcategoria | Edit mode only, if category has subcategories |

### New order

| # | Field | Notes |
|---|---|---|
| 1 | Nome | No change |
| 2 | Detalhes opcionais | No change to internal structure |
| 3 | Adicionar ao carrinho | No change to component |
| 4 | Categoria | No change to CategoryPopover internals |
| 5 | Subcategoria | Now shown in add mode too (see below) |

---

## 3. Subcategory Visibility Change

### Current condition

```tsx
{isEdit && filteredCategory?.subcategoryOrder && (
  // subcategory select
)}
```

### New condition

```tsx
{filteredCategory?.subcategoryOrder && (
  // subcategory select
)}
```

The `isEdit` guard is removed. The field appears in both add and edit modes whenever the selected category has a `subcategoryOrder` defined.

---

## Out of Scope

- No changes to `CategoryPopover` internals.
- No changes to `CartToggleRow`, `CurrencyInput`, or `UnitSegmentedControl`.
- No changes to form validation, submission logic, or React Hook Form setup.
- No desktop layout changes (the `sm:` breakpoint styles remain untouched).
