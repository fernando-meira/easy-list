# Product Drawer — Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase the drawer's minimum height on mobile and reorder the product form fields to a new sequence.

**Architecture:** Two isolated changes to two files. Task 1 modifies a single Tailwind class string in `responsive-product-dialog.tsx`. Task 2 reorders JSX blocks and removes an `isEdit` guard in `product-manager-sheet.tsx`. No logic changes, no new dependencies, no new imports.

**Tech Stack:** Next.js, React, Tailwind CSS, Radix UI Dialog, React Hook Form

---

## Files

| Action | File | What changes |
|--------|------|--------------|
| Modify | `src/components/responsive-product-dialog.tsx:115` | Replace `max-h-[min(90dvh,...)]` with `min-h-[60dvh] max-h-[var(...)]` |
| Modify | `src/components/product-manager-sheet.tsx:199-285` | Reorder JSX blocks; remove `isEdit &&` from subcategory condition |

---

## Task 1: Update drawer height

**Files:**
- Modify: `src/components/responsive-product-dialog.tsx:115`

- [ ] **Step 1: Replace the max-height class**

On line 115, find:
```
'max-h-[min(90dvh,calc(var(--product-dialog-available-height)-16px))]',
```

Replace with:
```
'min-h-[60dvh] max-h-[var(--product-dialog-available-height)]',
```

The full `cn(...)` block for the inner `<div>` becomes:
```tsx
className={cn(
  'pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-2xl',
  'border border-border/60 bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
  'min-h-[60dvh] max-h-[var(--product-dialog-available-height)]',
  'group-data-[state=closed]:animate-out group-data-[state=closed]:slide-out-to-bottom',
  'group-data-[state=open]:animate-in group-data-[state=open]:slide-in-from-bottom',
  'sm:mb-6 sm:max-w-[460px] sm:rounded-2xl'
)}
```

- [ ] **Step 2: Verify visually**

Run `npm run dev` and open the product drawer on a mobile viewport (or Chrome DevTools → iPhone dimensions). Verify:
- Drawer occupies at least ~60% of the screen height even with minimal content.
- Drawer with all fields visible (name + details + cart + category + subcategory) grows to fill the full available screen height.
- Triggering the virtual keyboard (tap a text input) still adjusts the drawer height correctly without overflow.

- [ ] **Step 3: Commit**

```bash
git add src/components/responsive-product-dialog.tsx
git commit -m "feat(drawer): grow to full height with 60dvh minimum"
```

---

## Task 2: Reorder form fields and unlock subcategory for add mode

**Files:**
- Modify: `src/components/product-manager-sheet.tsx:199-285`

- [ ] **Step 1: Replace the entire `<form>` contents**

The `<form>` tag itself (line 199) does not change. Replace everything between the opening `<form>` tag and its closing `</form>` with:

```tsx
<form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
  <div className="flex flex-col gap-[7px]">
    <span className="text-[13px] font-bold leading-[1.35] text-foreground">
      Produto
    </span>
    <Input
      required
      type="text"
      placeholder="Nome do produto"
      className="h-10 rounded-lg px-3.5 text-base font-semibold"
      {...methods.register('name')}
    />
  </div>

  <div className="flex flex-col gap-3 rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
    <div className="flex items-center justify-between">
      <span className="text-sm font-[750] leading-[1.35] text-foreground">
        Detalhes opcionais
      </span>
      <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
        pode preencher depois
      </span>
    </div>

    <div className="flex gap-2.5">
      <div className="flex flex-1 flex-col gap-[7px]">
        <span className="text-[13px] font-bold leading-[1.35] text-foreground">
          Preço
        </span>
        <CurrencyInput
          label=""
          placeholder="R$ 0,00"
          value={methods.watch('price')}
          onValueChange={(value) => methods.setValue('price', value)}
        />
      </div>
      <div className="flex flex-col gap-[7px]" style={{ width: 102 }}>
        <span className="text-[13px] font-bold leading-[1.35] text-foreground">
          {quantityLabel}
        </span>
        <Input
          min={0}
          step={0.1}
          type="number"
          inputMode="decimal"
          placeholder={quantityLabel}
          className="h-10 rounded-lg px-3.5 text-base"
          {...methods.register('quantity')}
        />
      </div>
    </div>

    <UnitSegmentedControl
      value={(unit as UnitEnum) || UnitEnum.unit}
      onChange={(val) => methods.setValue('unit', val)}
    />
  </div>

  <CartToggleRow
    checked={!!addToCart}
    onCheckedChange={(val) => methods.setValue('addToCart', val)}
  />

  <CategoryPopover
    value={categoryId}
    categories={categories}
    onChange={(id) =>
      methods.setValue('categoryId', id, { shouldValidate: true })
    }
  />

  {filteredCategory?.subcategoryOrder && (
    <div className="flex flex-col gap-[7px]">
      <span className="text-[13px] font-bold leading-[1.35] text-foreground">
        Seção
      </span>
      <select
        className="h-10 rounded-lg border border-input bg-background px-3.5 text-base font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        {...methods.register('subcategory')}
      >
        {filteredCategory.subcategoryOrder.map(sub => (
          <option key={sub} value={sub}>{sub}</option>
        ))}
        <option key="" value="">Outros</option>
      </select>
    </div>
  )}
</form>
```

- [ ] **Step 2: Verify visually — add mode**

Open the product drawer in add mode. Verify:
- Fields appear in order: Nome → Detalhes opcionais → Adicionar ao carrinho → Categoria → Subcategoria.
- If the active category has subcategories, the Subcategoria field appears (this is new behavior for add mode).
- If the active category has no subcategories, the Subcategoria field is absent.
- Submitting with a name creates the product successfully.

- [ ] **Step 3: Verify visually — edit mode**

Open the product drawer in edit mode for a product whose category has subcategories. Verify:
- Subcategoria field appears and is pre-filled with the product's existing subcategory value.
- Saving updates the product correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/product-manager-sheet.tsx
git commit -m "feat(drawer): reorder form fields and show subcategory in add mode"
```
