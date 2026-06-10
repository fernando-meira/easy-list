# Barcode Product Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-first barcode scanner that looks up products in Open Food Facts and adds them to the current category with manual fallbacks.

**Architecture:** Persist `barcode` as optional product data, expose a server-side barcode lookup route, and keep scanner UI isolated from product creation. `CategoryClient` owns the flow state and reuses `ProductManagerSheet` for manual fallback and edit-before-add.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Firestore, next-auth JWT, `@zxing/browser`, Open Food Facts API, shadcn/Radix-style UI components, npm.

---

## File Structure

- Modify `package.json` and `package-lock.json`: add `@zxing/browser` dependency using npm.
- Modify `src/types/interfaces.ts`: add optional `barcode` to `ProductProps`.
- Modify `src/lib/firestore-domain.ts`: read/write `barcode` in product mapping and persistence.
- Modify `src/components/product-manager-sheet.tsx`: accept `initialProduct`, reset add-mode form from scanner data, and preserve barcode on edit.
- Create `src/app/api/barcode/[code]/route.ts`: authenticated server-side Open Food Facts lookup route.
- Create `src/components/barcode-scanner-sheet.tsx`: camera/manual-code scanner sheet, no product creation logic.
- Create `src/components/barcode-product-preview.tsx`: result confirmation UI with add/edit/duplicate actions.
- Modify `src/components/sticky-footer.tsx`: add `Escanear` action beside `Adicionar produto`.
- Modify `src/app/category/category-client.tsx`: orchestrate scanner, lookup, duplicate detection, creation, edit-before-add, and fallback states.

## Task 1: Install Scanner Dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install `@zxing/browser` with npm**

Run:

```bash
npm install @zxing/browser
```

Expected: `package.json` and `package-lock.json` change. `package.json` should include an entry like:

```json
"@zxing/browser": "^0.1.5"
```

The exact installed version may be newer. Keep the version npm writes.

- [ ] **Step 2: Verify dependency tree**

Run:

```bash
npm ls @zxing/browser
```

Expected: command exits successfully and prints `@zxing/browser` under `easy-list@0.1.0`.

- [ ] **Step 3: Commit dependency change**

Run:

```bash
git status --short
git diff -- package.json package-lock.json
git add package.json package-lock.json
git commit -m "chore: add barcode scanner dependency"
```

Expected: commit contains only `package.json` and `package-lock.json`.

## Task 2: Persist Barcode On Products

**Files:**
- Modify: `src/types/interfaces.ts`
- Modify: `src/lib/firestore-domain.ts`

- [ ] **Step 1: Add `barcode` to `ProductProps`**

In `src/types/interfaces.ts`, change `ProductProps` to include `barcode?: string;` immediately after `name`:

```ts
export interface ProductProps {
  _id?: string;
  name: string;
  barcode?: string;
  unit?: string;
  price?: string;
  quantity?: string;
  categoryId?: string;
  addToCart?: boolean;
  updatedAt: string;
  createdAt: string;
  category?: CategoryProps;
}
```

- [ ] **Step 2: Return `barcode` from Firestore documents**

In `src/lib/firestore-domain.ts`, update `productFromDoc` to include `barcode`:

```ts
  return {
    _id: doc.id,
    name: data.name,
    barcode: data.barcode,
    price: data.price,
    quantity: data.quantity,
    unit: data.unit,
    categoryId: data.categoryId,
    addToCart: Boolean(data.addToCart),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    category,
  };
```

- [ ] **Step 3: Save `barcode` during product creation**

In `createProduct`, add `barcode: product.barcode ?? null,` after `name`:

```ts
  await productRef.set({
    name: product.name,
    barcode: product.barcode ?? null,
    price: product.price ?? null,
    quantity: product.quantity ?? null,
    unit: product.unit ?? null,
    categoryId: product.categoryId,
    userId: ownerUserId,
    addToCart: Boolean(product.addToCart),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
```

- [ ] **Step 4: Save `barcode` during product update**

In `updateProduct`, add `barcode: product.barcode ?? null,` after `name`:

```ts
  await productsCollection.doc(productId).update({
    name: product.name,
    barcode: product.barcode ?? null,
    price: product.price ?? null,
    quantity: product.quantity ?? null,
    unit: product.unit ?? null,
    categoryId: product.categoryId,
    addToCart: Boolean(product.addToCart),
    updatedAt: FieldValue.serverTimestamp(),
  });
```

- [ ] **Step 5: Verify types and lint**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands pass.

- [ ] **Step 6: Commit product barcode persistence**

Run:

```bash
git status --short
git diff -- src/types/interfaces.ts src/lib/firestore-domain.ts
git add src/types/interfaces.ts src/lib/firestore-domain.ts
git commit -m "feat: persist product barcodes"
```

Expected: commit contains only product type and Firestore mapping changes.

## Task 3: Add Server-Side Barcode Lookup Route

**Files:**
- Create: `src/app/api/barcode/[code]/route.ts`

- [ ] **Step 1: Create authenticated lookup route**

Create `src/app/api/barcode/[code]/route.ts` with this complete content:

```ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';

type RouteContext = {
  params: Promise<{ code: string }>;
};

type OpenFoodFactsResponse = {
  code?: string;
  status?: number;
  product?: {
    brands?: string;
    image_url?: string;
    product_name?: string;
  };
};

const BARCODE_PATTERN = /^[0-9A-Za-z-]{4,32}$/;
const LOOKUP_TIMEOUT_MS = 7000;

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });

  return token?.sub ?? null;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { code } = await context.params;
    const barcode = decodeURIComponent(code).trim();

    if (!BARCODE_PATTERN.test(barcode)) {
      return NextResponse.json({ error: 'Código de barras inválido' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({
        fields: 'code,product_name,brands,image_url',
      });
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?${params}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'easy-list/0.1.0 (barcode lookup)',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Não foi possível consultar o produto' },
          { status: 502 }
        );
      }

      const data = await response.json() as OpenFoodFactsResponse;

      if (data.status !== 1 || !data.product) {
        return NextResponse.json({ barcode, found: false });
      }

      const name = normalizeString(data.product.product_name);

      if (!name) {
        return NextResponse.json({ barcode, found: false });
      }

      return NextResponse.json({
        barcode,
        found: true,
        name,
        brand: normalizeString(data.product.brands),
        imageUrl: normalizeString(data.product.image_url),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Tempo esgotado ao consultar o produto' },
        { status: 504 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: 'Erro ao consultar código de barras' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify route compiles**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands pass. If lint wraps the long Open Food Facts URL differently, keep the auto-formatted version.

- [ ] **Step 3: Commit lookup route**

Run:

```bash
git status --short
git diff -- src/app/api/barcode/[code]/route.ts
git add src/app/api/barcode/[code]/route.ts
git commit -m "feat: add barcode lookup route"
```

Expected: commit contains only the new route.

## Task 4: Allow Scanner Initial Values In Product Form

**Files:**
- Modify: `src/components/product-manager-sheet.tsx`

- [ ] **Step 1: Add `initialProduct` prop type**

Update the props interface:

```ts
interface ProductManagerSheetProps {
  open?: boolean;
  product?: ProductProps;
  initialProduct?: Partial<ProductProps>;
  type?: AddOrEditProductTypeEnum;
  onOpenChange?: (open: boolean) => void;
}
```

Update the destructuring:

```ts
export const ProductManagerSheet = ({
  open,
  type,
  product,
  initialProduct,
  onOpenChange,
}: ProductManagerSheetProps) => {
```

- [ ] **Step 2: Add barcode to edit reset**

Inside the edit fetch reset object, add `barcode: data.barcode,` after `name`:

```ts
          methods.reset({
            _id: data._id,
            name: data.name,
            barcode: data.barcode,
            unit: data.unit,
            price: data.price,
            quantity: data.quantity,
            addToCart: data.addToCart,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            categoryId: selectedCategoryId || data.category?._id,
          });
```

- [ ] **Step 3: Reset add-mode form from scanner initial values**

Replace the non-edit reset object in the `if (!isEdit && categories.length > 0)` branch with:

```ts
        {
          barcode: initialProduct?.barcode,
          name: initialProduct?.name ?? '',
          price: initialProduct?.price ?? '',
          quantity: initialProduct?.quantity ?? '1',
          addToCart: initialProduct?.addToCart ?? false,
          unit: initialProduct?.unit ?? UnitEnum.unit,
          categoryId: initialProduct?.categoryId ?? selectedCategoryId,
        },
```

Update the dependency array comment block to include the initial values in the dependencies. The final effect dependencies should be:

```ts
  }, [
    open,
    product?._id,
    isEdit,
    selectedCategoryId,
    onOpenChange,
    initialProduct?.barcode,
    initialProduct?.name,
    initialProduct?.price,
    initialProduct?.quantity,
    initialProduct?.addToCart,
    initialProduct?.unit,
    initialProduct?.categoryId,
  ]);
```

Keep the existing comment about `categories.length` and `methods` being intentionally omitted.

- [ ] **Step 4: Verify form integration**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands pass.

- [ ] **Step 5: Commit form initial values**

Run:

```bash
git status --short
git diff -- src/components/product-manager-sheet.tsx
git add src/components/product-manager-sheet.tsx
git commit -m "feat: support scanner product defaults"
```

Expected: commit contains only `product-manager-sheet.tsx`.

## Task 5: Build Barcode Scanner Sheet

**Files:**
- Create: `src/components/barcode-scanner-sheet.tsx`

- [ ] **Step 1: Create isolated scanner component**

Create `src/components/barcode-scanner-sheet.tsx` with this complete content:

```tsx
'use client';

import * as React from 'react';
import { X, ScanLine } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BarcodeScannerSheetProps {
  open: boolean;
  isBusy?: boolean;
  onDetected: (code: string) => void;
  onOpenChange: (open: boolean) => void;
}

type ScannerControls = {
  stop: () => void;
};

const BARCODE_PATTERN = /^[0-9A-Za-z-]{4,32}$/;

export function BarcodeScannerSheet({
  open,
  isBusy = false,
  onDetected,
  onOpenChange,
}: BarcodeScannerSheetProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const controlsRef = React.useRef<ScannerControls | null>(null);
  const handledCodeRef = React.useRef<string | null>(null);
  const [manualCode, setManualCode] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [message, setMessage] = React.useState('Aponte a câmera para o código de barras.');

  const stopScanner = React.useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const handleCode = React.useCallback((code: string) => {
    const normalizedCode = code.trim();

    if (!BARCODE_PATTERN.test(normalizedCode)) {
      setMessage('Código inválido. Tente novamente ou digite manualmente.');
      return;
    }

    if (handledCodeRef.current === normalizedCode) return;

    handledCodeRef.current = normalizedCode;
    stopScanner();
    onDetected(normalizedCode);
  }, [onDetected, stopScanner]);

  React.useEffect(() => {
    if (!open) {
      stopScanner();
      handledCodeRef.current = null;
      setManualCode('');
      setStatus('idle');
      setMessage('Aponte a câmera para o código de barras.');
      return;
    }

    let cancelled = false;

    async function startScanner() {
      try {
        setStatus('starting');
        setMessage('Abrindo câmera...');

        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 150,
        });

        if (cancelled || !videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              handleCode(result.getText());
            }
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus('scanning');
        setMessage('Aponte a câmera para o código de barras.');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Não foi possível acessar a câmera. Digite o código manualmente.');
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [handleCode, open, stopScanner]);

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleCode(manualCode);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.12)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:bottom-6 sm:rounded-2xl">
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex items-start justify-between px-5 pb-4 pt-4">
            <div className="flex flex-col gap-1 pr-3">
              <DialogPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                Escanear produto
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-[1.5] text-muted-foreground">
                {message}
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close
              aria-label="Fechar"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
            >
              <X className="h-5 w-5 text-foreground" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                {status === 'scanning' ? 'Lendo código' : 'Preparando câmera'}
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
              <label className="text-[13px] font-bold leading-[1.35] text-foreground" htmlFor="manual-barcode">
                Código manual
              </label>
              <div className="flex gap-2">
                <Input
                  id="manual-barcode"
                  inputMode="numeric"
                  value={manualCode}
                  disabled={isBusy}
                  placeholder="Digite o código de barras"
                  onChange={(event) => setManualCode(event.target.value)}
                  className="h-10 rounded-lg px-3.5 text-base"
                />
                <Button type="submit" disabled={isBusy || manualCode.trim().length < 4}>
                  <ScanLine className="mr-1 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

- [ ] **Step 2: Verify scanner component compiles**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands pass. If TypeScript reports that `BrowserMultiFormatReader` does not accept constructor arguments, replace these lines:

```ts
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 150,
        });
```

with:

```ts
        const reader = new BrowserMultiFormatReader();
```

Then rerun `npm run lint` and `npx tsc --noEmit`.

- [ ] **Step 3: Commit scanner component**

Run:

```bash
git status --short
git diff -- src/components/barcode-scanner-sheet.tsx
git add src/components/barcode-scanner-sheet.tsx
git commit -m "feat: add barcode scanner sheet"
```

Expected: commit contains only `barcode-scanner-sheet.tsx`.

## Task 6: Build Barcode Product Preview

**Files:**
- Create: `src/components/barcode-product-preview.tsx`

- [ ] **Step 1: Create preview component**

Create `src/components/barcode-product-preview.tsx` with this complete content:

```tsx
'use client';

/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { X, Pencil, Plus, ImageOff } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Button } from '@/components/ui/button';

export interface BarcodeLookupResult {
  barcode: string;
  found: boolean;
  name?: string;
  brand?: string;
  imageUrl?: string;
}

interface BarcodeProductPreviewProps {
  open: boolean;
  result: BarcodeLookupResult | null;
  duplicateName?: string;
  isCreating?: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onEditDuplicate?: () => void;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeProductPreview({
  open,
  result,
  duplicateName,
  isCreating = false,
  onAdd,
  onEdit,
  onEditDuplicate,
  onOpenChange,
}: BarcodeProductPreviewProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [result?.imageUrl]);

  if (!result) return null;

  const title = duplicateName ? 'Produto já está na lista' : 'Produto encontrado';
  const description = duplicateName
    ? `${duplicateName} tem o mesmo código de barras nesta categoria.`
    : 'Confira as informações antes de adicionar.';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.12)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:bottom-6 sm:rounded-2xl">
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex items-start justify-between px-5 pb-4 pt-4">
            <div className="flex flex-col gap-1 pr-3">
              <DialogPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-[1.5] text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close
              aria-label="Fechar"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
            >
              <X className="h-5 w-5 text-foreground" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <div className="flex gap-3 rounded-2xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background">
                {result.imageUrl && !imageFailed ? (
                  <img
                    src={result.imageUrl}
                    alt="Imagem do produto"
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-lg font-semibold leading-tight text-foreground">
                  {result.name}
                </span>
                {result.brand ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    {result.brand}
                  </span>
                ) : null}
                <span className="mt-auto font-mono text-xs text-muted-foreground">
                  {result.barcode}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {duplicateName && onEditDuplicate ? (
                <Button type="button" variant="outline" onClick={onEditDuplicate}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar produto existente
                </Button>
              ) : null}

              <Button type="button" disabled={isCreating} onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {duplicateName ? 'Adicionar mesmo assim' : 'Adicionar à lista'}
              </Button>

              <Button type="button" variant="outline" disabled={isCreating} onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar antes
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

- [ ] **Step 2: Verify preview component compiles**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands pass. The raw `<img>` has a focused lint disable because Open Food Facts image domains are variable and should not require broad `next.config` image-domain changes in this first cut.

- [ ] **Step 3: Commit preview component**

Run:

```bash
git status --short
git diff -- src/components/barcode-product-preview.tsx
git add src/components/barcode-product-preview.tsx
git commit -m "feat: add barcode product preview"
```

Expected: commit contains only `barcode-product-preview.tsx`.

## Task 7: Add Scan Action To Sticky Footer

**Files:**
- Modify: `src/components/sticky-footer.tsx`

- [ ] **Step 1: Add scan callback prop and icon**

Replace the import and props with:

```tsx
import { Plus, ScanLine } from 'lucide-react';

import { ProductProps } from '@/types/interfaces';
import { convertToCurrency, calculateTotalValue } from '@/utils';

interface StickyFooterProps {
  products: ProductProps[];
  onAddProduct: () => void;
  onScanProduct: () => void;
}

export function StickyFooter({ products, onAddProduct, onScanProduct }: StickyFooterProps) {
```

- [ ] **Step 2: Replace single button with two actions**

Replace the current add-product button block with:

```tsx
        <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
          <button
            type="button"
            aria-label="Escanear produto"
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onScanProduct();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)]"
          >
            <ScanLine className="h-[18px] w-[18px]" />
            <span className="text-[14px] font-semibold">
              Escanear
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onAddProduct();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)]"
          >
            <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
            <span className="text-[14px] font-semibold text-[var(--color-on-primary)]">
              Adicionar produto
            </span>
          </button>
        </div>
```

- [ ] **Step 3: Verify sticky footer type errors surface where expected**

Run:

```bash
npx tsc --noEmit
```

Expected: TypeScript fails because `CategoryClient` has not passed `onScanProduct` yet. The failure should point at `src/app/category/category-client.tsx` and mention `onScanProduct` is missing.

- [ ] **Step 4: Do not commit yet**

Leave this change uncommitted. It will be completed and committed with `CategoryClient` integration in Task 8.

## Task 8: Integrate Scanner Flow In Category Client

**Files:**
- Modify: `src/app/category/category-client.tsx`
- Modify: `src/components/sticky-footer.tsx` from Task 7

- [ ] **Step 1: Update imports**

In `src/app/category/category-client.tsx`, update imports to include `toast`, `BarcodeScannerSheet`, `BarcodeProductPreview`, `BarcodeLookupResult`, and `UnitEnum`:

```tsx
'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import { ProductProps } from '@/types/interfaces';
import { StateCard } from '@/components/state-card';
import { ProductRow } from '@/components/product-row';
import { useProducts, useCategories } from '@/context';
import { GroupHeader } from '@/components/group-header';
import { StickyFooter } from '@/components/sticky-footer';
import { CategoryHeroCard } from '@/components/category-hero-card';
import { ProductManagerSheet } from '@/components/product-manager-sheet';
import { CategoryPageSkeleton } from '@/components/category-page-skeleton';
import { BarcodeScannerSheet } from '@/components/barcode-scanner-sheet';
import { UnitEnum, AddOrEditProductTypeEnum } from '@/types/enums';
import {
  BarcodeLookupResult,
  BarcodeProductPreview,
} from '@/components/barcode-product-preview';
```

- [ ] **Step 2: Add scanner state**

After the existing `useState` calls, add:

```tsx
  const [scannerOpen, setScannerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lookupResult, setLookupResult] = useState<BarcodeLookupResult | null>(null);
  const [scannerInitialProduct, setScannerInitialProduct] = useState<Partial<ProductProps> | undefined>();
  const [isBarcodeBusy, setIsBarcodeBusy] = useState(false);
```

- [ ] **Step 3: Destructure `managerProduct`**

Replace:

```tsx
  const { removeProduct, toggleCart, isProductLoading } = useProducts();
```

with:

```tsx
  const { removeProduct, toggleCart, managerProduct, isProductLoading } = useProducts();
```

- [ ] **Step 4: Add scanner helper functions**

Place these functions after `handleEditProduct`:

```tsx
  const buildProductFromLookup = (result: BarcodeLookupResult): Partial<ProductProps> => ({
    name: result.name ?? '',
    barcode: result.barcode,
    categoryId: filteredCategory?._id,
    quantity: '1',
    unit: UnitEnum.unit,
    addToCart: false,
  });

  const findDuplicateProduct = (barcode?: string) => {
    if (!barcode) return undefined;

    return (filteredCategory?.products ?? []).find(product => product.barcode === barcode);
  };

  const openManualProductForm = (initialProduct: Partial<ProductProps>) => {
    setScannerInitialProduct(initialProduct);
    setPreviewOpen(false);
    setScannerOpen(false);
    setAddSheetOpen(true);
  };

  const buildFallbackProduct = (barcode: string): Partial<ProductProps> => ({
    barcode,
    categoryId: filteredCategory?._id,
    quantity: '1',
    unit: UnitEnum.unit,
  });

  const handleBarcodeDetected = async (code: string) => {
    setIsBarcodeBusy(true);

    try {
      const response = await fetch(`/api/barcode/${encodeURIComponent(code)}`);

      if (!response.ok) {
        toast.error('Não foi possível consultar o produto. Cadastre manualmente.');
        openManualProductForm(buildFallbackProduct(code));
        return;
      }

      const result = await response.json() as BarcodeLookupResult;

      if (!result.found || !result.name) {
        toast('Produto não encontrado. Cadastre manualmente.');
        openManualProductForm(buildFallbackProduct(result.barcode || code));
        return;
      }

      setLookupResult(result);
      setScannerOpen(false);
      setPreviewOpen(true);
    } catch {
      toast.error('Erro ao consultar o código de barras. Cadastre manualmente.');
      openManualProductForm(buildFallbackProduct(code));
    } finally {
      setIsBarcodeBusy(false);
    }
  };

  const handleAddLookupProduct = async () => {
    if (!lookupResult || !filteredCategory?._id || !lookupResult.name) return;

    setIsBarcodeBusy(true);

    try {
      await managerProduct({
        product: {
          name: lookupResult.name,
          barcode: lookupResult.barcode,
          categoryId: filteredCategory._id,
          quantity: '1',
          unit: UnitEnum.unit,
          addToCart: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      setPreviewOpen(false);
      setLookupResult(null);
    } finally {
      setIsBarcodeBusy(false);
    }
  };

  const handleEditLookupProduct = () => {
    if (!lookupResult) return;

    openManualProductForm(buildProductFromLookup(lookupResult));
  };

  const handleEditDuplicateProduct = () => {
    const duplicate = findDuplicateProduct(lookupResult?.barcode);

    if (!duplicate) return;

    setSelectedProduct(duplicate);
    setPreviewOpen(false);
    setEditSheetOpen(true);
  };
```

- [ ] **Step 5: Pass `onScanProduct` to `StickyFooter`**

Replace the `StickyFooter` block with:

```tsx
      <StickyFooter
        products={allProducts}
        onAddProduct={() => {
          setScannerInitialProduct(undefined);
          setAddSheetOpen(true);
        }}
        onScanProduct={() => setScannerOpen(true)}
      />
```

- [ ] **Step 6: Pass scanner defaults to add product sheet**

Update the add `ProductManagerSheet`:

```tsx
      <ProductManagerSheet
        open={addSheetOpen}
        initialProduct={scannerInitialProduct}
        onOpenChange={setAddSheetOpen}
        type={AddOrEditProductTypeEnum.add}
      />
```

- [ ] **Step 7: Render scanner and preview components**

Add these components after the edit `ProductManagerSheet`:

```tsx
      <BarcodeScannerSheet
        open={scannerOpen}
        isBusy={isBarcodeBusy}
        onDetected={handleBarcodeDetected}
        onOpenChange={setScannerOpen}
      />

      <BarcodeProductPreview
        open={previewOpen}
        result={lookupResult}
        duplicateName={findDuplicateProduct(lookupResult?.barcode)?.name}
        isCreating={isBarcodeBusy}
        onAdd={handleAddLookupProduct}
        onEdit={handleEditLookupProduct}
        onEditDuplicate={handleEditDuplicateProduct}
        onOpenChange={setPreviewOpen}
      />
```

- [ ] **Step 8: Verify integrated scanner flow compiles**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands pass.

- [ ] **Step 9: Commit scanner integration**

Run:

```bash
git status --short
git diff -- src/app/category/category-client.tsx src/components/sticky-footer.tsx
git add src/app/category/category-client.tsx src/components/sticky-footer.tsx
git commit -m "feat: integrate barcode scanner flow"
```

Expected: commit contains `CategoryClient` and `StickyFooter` integration.

## Task 9: Final Verification And Manual QA

**Files:**
- No source edits expected unless verification reveals a defect.

- [ ] **Step 1: Run full static verification**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all commands pass. `npm run build` may load `.env.local`; do not print or inspect secret values.

- [ ] **Step 2: Run development server for manual checks**

Run:

```bash
npm run dev
```

Expected: Next.js dev server starts. Use a mobile browser or device emulation with a real camera where possible.

- [ ] **Step 3: Manual QA cases**

Verify these cases in the running app:

```text
1. Category page shows Escanear beside Adicionar produto.
2. Tapping Escanear opens the camera sheet.
3. Closing the sheet stops the camera indicator.
4. Manual code entry with a known Open Food Facts code shows the preview.
5. Produto encontrado -> Adicionar à lista creates a product with quantity 1 and unit unit.
6. Produto encontrado -> Editar antes opens Novo produto with name and barcode preserved.
7. Unknown code opens Novo produto with barcode preserved and empty name.
8. Reusing a code already in the category shows duplicate copy and Editar produto existente.
9. Denying camera permission leaves manual code entry usable.
10. Preview remains usable if the external image fails.
```

Use known public barcode `3017620422003` for a basic Open Food Facts found case.

- [ ] **Step 4: Fix verification defects in focused commits**

If a defect is found, edit only the files related to that defect, rerun:

```bash
npm run lint
npx tsc --noEmit
```

Then commit with a focused message. For a scanner fallback fix, run:

```bash
git add src/components/barcode-scanner-sheet.tsx src/app/category/category-client.tsx
git commit -m "fix: handle barcode scanner camera fallback"
```

- [ ] **Step 5: Report final status**

Report:

```text
Implemented barcode product registration.
Verification: npm run lint, npx tsc --noEmit, npm run build.
Manual QA: list passed cases and any device/browser used.
Known limitations: Open Food Facts coverage and browser camera differences.
```
