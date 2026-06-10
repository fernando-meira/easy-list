# Loading Skeletons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add proper loading skeleton feedback to the home screen (category listing) and the category page (product listing), replacing a blank-screen experience while Firebase loads.

**Architecture:** Two dedicated skeleton components mirror the visual structure of their target screens. `CategoryCard` renders `<CategoryListSkeleton />` via an early return when `isLoadingCategories` is true. `CategoryClient` renders `<CategoryPageSkeleton />` when `isLoadingCategories && !filteredCategory`, replacing the current `null` return. A dead orphaned `HomeLoading` component is removed.

**Tech Stack:** Next.js 15, React, TypeScript 5, Tailwind CSS, Firebase Firestore (via `onSnapshot`)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/category-list-skeleton.tsx` | Pure presentational skeleton for home category list |
| Create | `src/components/category-page-skeleton.tsx` | Pure presentational skeleton for category page |
| Modify | `src/components/category-card.tsx` | Add early return for loading; remove dead skeleton branch |
| Modify | `src/app/category/category-client.tsx` | Remove instant-resolving `isLoading`; add `CategoryPageSkeleton` |
| Delete | `src/components/home-loading.tsx` | Orphaned component — never imported anywhere |

---

### Task 1: Create `CategoryListSkeleton`

**Files:**
- Create: `src/components/category-list-skeleton.tsx`

- [ ] **Step 1: Create the file**

`src/components/category-list-skeleton.tsx`:
```tsx
const skel = 'bg-[var(--color-hairline)] animate-pulse';

export function CategoryListSkeleton() {
  return (
    <main className="flex flex-col gap-4">
      <div className={`${skel} h-[34px] w-40 rounded-lg`} />

      <section className="flex flex-col gap-3">
        <div className={`${skel} h-[14px] w-[120px] rounded`} />

        <div className="flex flex-col gap-2">
          <div className={`${skel} h-3 w-[90px] rounded`} />
          <div className={`${skel} h-[86px] w-full rounded-xl`} />
          <div className={`${skel} h-[86px] w-full rounded-xl`} />
        </div>

        <div className="flex flex-col gap-2">
          <div className={`${skel} h-3 w-[60px] rounded`} />
          <div className={`${skel} h-[86px] w-full rounded-xl`} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className={`${skel} h-[14px] w-[140px] rounded`} />
        <div className={`${skel} h-[56px] w-full rounded-xl`} />
      </section>

      <div className={`${skel} h-10 w-40 rounded-full`} />
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/category-list-skeleton.tsx
git commit -m "feat: add CategoryListSkeleton component"
```

---

### Task 2: Wire `CategoryListSkeleton` into `CategoryCard`; delete `HomeLoading`

**Files:**
- Modify: `src/components/category-card.tsx`
- Delete: `src/components/home-loading.tsx`

- [ ] **Step 1: Update the import in `category-card.tsx`**

Remove the `Skeleton` import and add `CategoryListSkeleton`:
```tsx
// Remove this line:
import { Skeleton } from '@/components/ui/skeleton';

// Add this line (keep all other imports unchanged):
import { CategoryListSkeleton } from '@/components/category-list-skeleton';
```

- [ ] **Step 2: Add early return before the JSX `return`**

In `CategoryCard`, after all hooks and `useCallback` definitions but just before the `return (` statement, add:
```tsx
if (isLoadingCategories) return <CategoryListSkeleton />;
```

- [ ] **Step 3: Remove the dead skeleton branch inside `renderContent`**

Inside the `renderContent` callback, remove the entire `if (isLoadingCategories)` block (it was unreachable):
```tsx
// Remove this entire block from renderContent:
if (isLoadingCategories) {
  return Array.from({ length: 4 }).map((_, index) => (
    <Skeleton key={index} className="h-[86px] w-full rounded-[var(--radius-lg)]" />
  ));
}
```

- [ ] **Step 4: Delete `HomeLoading`**

```bash
git rm src/components/home-loading.tsx
```

- [ ] **Step 5: Verify no remaining references to `HomeLoading`**

```bash
npx grep-cli "HomeLoading\|home-loading" src/ --include="*.tsx" --include="*.ts"
```

If the above command isn't available, use:
```bash
npm run build
```

Expected: build succeeds. Any lingering import of `HomeLoading` would cause a TypeScript error.

- [ ] **Step 6: Verify skeleton displays on home screen**

```bash
npm run dev
```

Open `http://localhost:3000`. In DevTools → Network tab, set throttling to **Slow 3G**, then hard-reload (`Ctrl+Shift+R`). While Firebase loads you should see animated gray blocks: a title placeholder, section label placeholders, three `86px` category card placeholders, one `56px` shared card placeholder, and a pill-shaped add button placeholder.

- [ ] **Step 7: Commit**

```bash
git add src/components/category-card.tsx
git commit -m "feat: wire CategoryListSkeleton into CategoryCard; remove HomeLoading"
```

---

### Task 3: Create `CategoryPageSkeleton`

**Files:**
- Create: `src/components/category-page-skeleton.tsx`

- [ ] **Step 1: Create the file**

`src/components/category-page-skeleton.tsx`:
```tsx
const skel = 'bg-[var(--color-hairline)] animate-pulse';

export function CategoryPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-[140px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <div className={`${skel} h-3 w-9 rounded-sm`} />
        <div className={`${skel} h-3 w-1.5 rounded-sm`} />
        <div className={`${skel} h-3 w-[90px] rounded-sm`} />
      </div>

      {/* Hero card — faithful structure */}
      <div className="flex flex-col gap-[14px] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] p-[18px]">
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-col gap-1">
            <div className={`${skel} h-7 w-[190px] rounded-md`} />
            <div className={`${skel} h-[13px] w-[130px] rounded`} />
          </div>
          <div className={`${skel} h-8 w-[120px] rounded-full`} />
        </div>

        <div className="flex gap-[10px]">
          <div className={`${skel} h-[34px] flex-1 rounded-full`} />
          <div className={`${skel} h-[34px] flex-1 rounded-full`} />
        </div>

        <div className={`${skel} h-10 w-full rounded-md`} />
        <div className={`${skel} h-16 w-full rounded-md`} />
      </div>

      {/* Fora do carrinho */}
      <div className={`${skel} h-[14px] w-[120px] rounded`} />
      {[0, 1, 2].map(i => (
        <div key={i} className={`${skel} h-[68px] w-full rounded-xl`} />
      ))}

      {/* Carrinho */}
      <div className={`${skel} h-[14px] w-[80px] rounded`} />
      {[0, 1].map(i => (
        <div key={i} className={`${skel} h-[68px] w-full rounded-xl`} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/category-page-skeleton.tsx
git commit -m "feat: add CategoryPageSkeleton component"
```

---

### Task 4: Wire `CategoryPageSkeleton` into `CategoryClient`

**Files:**
- Modify: `src/app/category/category-client.tsx`

- [ ] **Step 1: Update imports**

```tsx
// Remove this line:
import { Skeleton } from '@/components/ui/skeleton';

// Add this line (keep all other imports unchanged):
import { CategoryPageSkeleton } from '@/components/category-page-skeleton';
```

- [ ] **Step 2: Remove the `isLoading` local state declaration**

```tsx
// Remove this line only — keep the other useState calls (addSheetOpen, editSheetOpen, selectedProduct):
const [isLoading, setIsLoading] = useState(true);
```

- [ ] **Step 3: Simplify the `useEffect` that sets the category ID**

```tsx
// Replace the entire useEffect with this simplified version:
useEffect(() => {
  if (!categoryId) return;
  setSelectedCategoryId(categoryId);
}, [categoryId, setSelectedCategoryId]);
```

The original called `setIsLoading(false)` in both branches — that's no longer needed.

- [ ] **Step 4: Replace the three loading/null guards**

Find and remove these three consecutive blocks:
```tsx
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
```

Replace with:
```tsx
if (isLoadingCategories && !filteredCategory) {
  return <CategoryPageSkeleton />;
}

if (!filteredCategory) {
  return <StateCard variant="error" />;
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npm run build
```

Expected: build succeeds. TypeScript will catch any references to the removed `isLoading` variable.

- [ ] **Step 6: Verify skeleton displays on category page**

With `npm run dev` running, set DevTools network throttling to **Slow 3G**. Navigate to or hard-reload a category URL (e.g. `http://localhost:3000/category?id=<any-id>`). You should see:
- Breadcrumb placeholder (3 inline blocks)
- Hero card with internal skeleton: title line, subtitle line, cart badge pill, two stat pills, share button block, selector block
- Two groups of product row skeletons (3 + 2)

After loading completes, the real category page should render normally.

- [ ] **Step 7: Final lint check**

```bash
npm run lint
```

Expected: no errors or warnings.

- [ ] **Step 8: Commit**

```bash
git add src/app/category/category-client.tsx
git commit -m "feat: wire CategoryPageSkeleton into CategoryClient; fix blank loading state"
```
