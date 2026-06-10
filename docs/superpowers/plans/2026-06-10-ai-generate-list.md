# AI Generate List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ✨ button to the home page footer that lets the user type a free-text prompt and have Claude generate a category with suggested products based on their purchase history.

**Architecture:** A new Next.js API route (`POST /api/ai/generate-list`) fetches the user's category history from Firestore, builds a prompt with that context, calls `claude-sonnet-4-6`, and returns `{ categoryName, products[] }`. Two new drawer components handle the input and the pre-creation review flow. The ✨ button lives in the existing `Footer` component next to the "Adicionar categoria" button.

**Tech Stack:** Next.js 15, TypeScript, Firebase Admin (Firestore), `@anthropic-ai/sdk`, `vaul` drawers, `sonner` toasts, Tailwind CSS.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/types/interfaces.ts` | Add `AiGeneratedList` interface |
| Modify | `src/lib/firestore-domain.ts` | Add `getUserHistoryForAI` function |
| Create | `src/app/api/ai/generate-list/route.ts` | POST handler — auth, history, Claude call |
| Create | `src/components/ai-generate-list-drawer.tsx` | Input drawer with prompt field |
| Create | `src/components/ai-review-list-drawer.tsx` | Review drawer with removable items |
| Modify | `src/components/footer.tsx` | Add ✨ button + wire up both drawers |

---

## Task 1: Install `@anthropic-ai/sdk` and configure env var

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Install the SDK**

```bash
npm install @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` appears in `package.json` dependencies.

- [ ] **Step 2: Add the API key to `.env.local`**

Open `.env.local` and add:

```
ANTHROPIC_API_KEY=sk-ant-...
```

> Get the key from https://console.anthropic.com/settings/keys

- [ ] **Step 3: Verify TypeScript resolves the SDK**

```bash
npx tsc --noEmit
```

Expected: no errors related to `@anthropic-ai/sdk`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk dependency"
```

---

## Task 2: Add `AiGeneratedList` type to `interfaces.ts`

**Files:**
- Modify: `src/types/interfaces.ts`

- [ ] **Step 1: Add the interface**

Open `src/types/interfaces.ts`. The file currently exports `CategoryProps` and `ProductProps`. Add the new interface at the end, following the staircase ordering rule (shorter properties first):

```ts
export interface AiGeneratedList {
  products: { name: string }[];
  categoryName: string;
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/interfaces.ts
git commit -m "feat: add AiGeneratedList interface"
```

---

## Task 3: Add `getUserHistoryForAI` to `firestore-domain.ts`

**Files:**
- Modify: `src/lib/firestore-domain.ts`

This function fetches the 5 most recently updated categories for a user, plus up to 5 product names per category — used as context for the Claude prompt.

- [ ] **Step 1: Add the function**

Open `src/lib/firestore-domain.ts`. Add at the end of the file (after `lookupShareToken`):

```ts
export async function getUserHistoryForAI(
  userId: string
): Promise<{ name: string; products: string[] }[]> {
  const categoriesSnapshot = await categoriesCollection
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .limit(5)
    .get();

  if (categoriesSnapshot.empty) return [];

  const result: { name: string; products: string[] }[] = [];

  for (const categoryDoc of categoriesSnapshot.docs) {
    const productsSnapshot = await productsCollection
      .where('userId', '==', userId)
      .where('categoryId', '==', categoryDoc.id)
      .limit(5)
      .get();

    result.push({
      name: categoryDoc.data().name as string,
      products: productsSnapshot.docs.map((doc) => doc.data().name as string),
    });
  }

  return result;
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firestore-domain.ts
git commit -m "feat: add getUserHistoryForAI to firestore-domain"
```

---

## Task 4: Create `POST /api/ai/generate-list` route

**Files:**
- Create: `src/app/api/ai/generate-list/route.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/api/ai/generate-list
```

- [ ] **Step 2: Write the route**

Create `src/app/api/ai/generate-list/route.ts` with the following content:

```ts
import Anthropic from '@anthropic-ai/sdk';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { getUserHistoryForAI } from '@/lib/firestore-domain';

const client = new Anthropic();

function buildSystemPrompt(history: { name: string; products: string[] }[]): string {
  const base = `Você é um assistente de lista de compras.
Responda APENAS com JSON válido, sem texto adicional, no formato:
{ "categoryName": string, "products": [{ "name": string }] }

Gere entre 8 e 15 produtos por padrão, adequados ao contexto do pedido.
Os nomes devem estar em português do Brasil.`;

  if (history.length === 0) return base;

  const lines = history.map((c) => `- ${c.name}: ${c.products.join(', ')}`).join('\n');

  return `${base}

Histórico de compras do usuário:
${lines}

Use esse histórico como referência de preferências, mas adapte ao pedido atual.`;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<{ categoryName: string; products: { name: string }[] }> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  return JSON.parse(text);
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: authSecret });
    const userId = token?.sub ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const prompt: string = body?.prompt;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const history = await getUserHistoryForAI(userId);
    const systemPrompt = buildSystemPrompt(history);

    let result: { categoryName: string; products: { name: string }[] };

    try {
      result = await callClaude(systemPrompt, prompt);
    } catch {
      result = await callClaude(systemPrompt, prompt);
    }

    if (!result.categoryName) {
      result.categoryName = prompt.slice(0, 50);
    }

    if (!result.products || result.products.length === 0) {
      return NextResponse.json(
        { error: 'A IA não conseguiu gerar produtos para este pedido.' },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao gerar lista com IA' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/generate-list/route.ts
git commit -m "feat: add POST /api/ai/generate-list route"
```

---

## Task 5: Create `AiGenerateListDrawer` component

**Files:**
- Create: `src/components/ai-generate-list-drawer.tsx`

This drawer collects the user's free-text prompt and calls the API. On success it passes the result up via `onGenerated`.

- [ ] **Step 1: Create the file**

Create `src/components/ai-generate-list-drawer.tsx`:

```tsx
'use client';

import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useState, FormEvent } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';
import { AiGeneratedList } from '@/types/interfaces';
import { LoadingSpinner } from '@/components/loading-spinner';

interface AiGenerateListDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onGenerated: (result: AiGeneratedList) => void;
}

export function AiGenerateListDrawer({
  open,
  onGenerated,
  onOpenChange,
}: AiGenerateListDrawerProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (isLoading) return;
    setPrompt('');
    onOpenChange?.(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate-list', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('API error');

      const result: AiGeneratedList = await response.json();

      setPrompt('');
      onOpenChange?.(false);
      onGenerated(result);
    } catch {
      toast.error('Não foi possível gerar a lista. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
            'sm:mx-auto sm:max-w-[460px] sm:rounded-2xl sm:mb-6'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  Criar lista com IA
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  Descreva o que você precisa e a IA monta a lista.
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={handleClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-[7px]">
                <span className="text-[13px] font-bold leading-[1.35] text-foreground">
                  O que você precisa?
                </span>
                <textarea
                  required
                  value={prompt}
                  disabled={isLoading}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: lista para festa de aniversário infantil para 20 crianças"
                  className="h-24 w-full resize-none rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size={16} />
                      Gerando sua lista...
                    </>
                  ) : (
                    'Gerar lista →'
                  )}
                </button>
              </div>
            </form>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ai-generate-list-drawer.tsx
git commit -m "feat: add AiGenerateListDrawer component"
```

---

## Task 6: Create `AiReviewListDrawer` component

**Files:**
- Create: `src/components/ai-review-list-drawer.tsx`

This drawer shows the generated items, lets the user remove unwanted ones, then creates the category and products via direct API calls (bypassing the context `addCategory` because we need the returned `_id` to create products).

- [ ] **Step 1: Create the file**

Create `src/components/ai-review-list-drawer.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { AiGeneratedList } from '@/types/interfaces';
import { LoadingSpinner } from '@/components/loading-spinner';

interface AiReviewListDrawerProps {
  open?: boolean;
  result: AiGeneratedList | null;
  onOpenChange?: (open: boolean) => void;
}

export function AiReviewListDrawer({ open, result, onOpenChange }: AiReviewListDrawerProps) {
  const router = useRouter();
  const { markLocalMutation } = useCategories();
  const [products, setProducts] = useState<{ name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setProducts(result?.products ?? []);
  }, [result]);

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!result || isSaving) return;

    setIsSaving(true);
    markLocalMutation(1 + products.length);

    try {
      const categoryResponse = await fetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: result.categoryName }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!categoryResponse.ok) throw new Error('Failed to create category');

      const { data: category } = await categoryResponse.json();

      for (const product of products) {
        await fetch('/api/products', {
          method: 'POST',
          body: JSON.stringify({ name: product.name, categoryId: category._id }),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      onOpenChange?.(false);
      router.push(`/category?id=${category._id}`);
    } catch {
      markLocalMutation(-(1 + products.length));
      toast.error('Não foi possível criar a lista. Tente novamente.');
      setIsSaving(false);
    }
  };

  const buttonLabel =
    products.length === 0 ? 'Criar categoria vazia' : `Criar lista (${products.length} itens)`;

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
            'max-h-[85vh]',
            'sm:mx-auto sm:max-w-[460px] sm:rounded-2xl sm:mb-6'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex flex-shrink-0 items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  {result?.categoryName}
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  {products.length} {products.length === 1 ? 'item' : 'itens'} · toque em ✕ para remover
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

            <div className="flex flex-col gap-2 overflow-y-auto">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5"
                >
                  <span className="text-sm font-semibold text-foreground">{product.name}</span>
                  <button
                    type="button"
                    aria-label={`Remover ${product.name}`}
                    onClick={() => removeProduct(index)}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex h-10 w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
            >
              {isSaving ? <LoadingSpinner size={16} /> : buttonLabel}
            </button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ai-review-list-drawer.tsx
git commit -m "feat: add AiReviewListDrawer component"
```

---

## Task 7: Wire ✨ button in `footer.tsx`

**Files:**
- Modify: `src/components/footer.tsx`

The home page section of `Footer` currently renders a full-width "Adicionar categoria" button. Replace that section with a grid that adds the ✨ button on the right.

- [ ] **Step 1: Update `footer.tsx`**

Open `src/components/footer.tsx`. Replace the entire file with:

```tsx
'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { PagesEnum } from '@/types/enums';
import { convertToCurrency } from '@/utils';
import { calculateTotalValue } from '@/utils';
import { AiGeneratedList } from '@/types/interfaces';
import { useProducts } from '@/context/ProductContext';

import { NewProductForm } from './new-product-form';
import { NewCategoryDrawer } from './new-category-drawer';
import { AiGenerateListDrawer } from './ai-generate-list-drawer';
import { AiReviewListDrawer } from './ai-review-list-drawer';

export function Footer() {
  const pathname = usePathname();
  const { products, allProductsWithoutPrice, allProductsInCartWithoutPrice } = useProducts();

  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AiGeneratedList | null>(null);

  const isHomePage = pathname === PagesEnum.home;
  const shouldRenderPrice =
    !!products &&
    !isHomePage &&
    (!allProductsWithoutPrice || !allProductsInCartWithoutPrice);

  const handleGenerated = (result: AiGeneratedList) => {
    setAiResult(result);
    setAiReviewOpen(true);
  };

  return (
    <footer className="fixed bottom-0 w-full m-auto rounded-t-sm max-w-3xl bg-white dark:bg-background">
      {shouldRenderPrice && (
        <div className="p-4 flex justify-between gap-4 mx-auto">
          {!allProductsWithoutPrice && (
            <p className="font-semibold">
              Total: {convertToCurrency(calculateTotalValue(products).totalProductsValue)}
            </p>
          )}

          {!allProductsInCartWithoutPrice && (
            <p className="font-semibold text-teal-400">
              Carrinho: {convertToCurrency(calculateTotalValue(products).filteredProductsValue)}
            </p>
          )}
        </div>
      )}

      <div className={isHomePage ? 'w-full p-4' : 'flex items-center gap-2'}>
        {!isHomePage ? (
          <NewProductForm />
        ) : (
          <>
            <div className="grid grid-cols-[1fr_48px] gap-2">
              <button
                type="button"
                onClick={(e) => {
                  (e.currentTarget as HTMLButtonElement).blur();
                  setCategoryDrawerOpen(true);
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
                <span className="text-sm font-semibold text-[var(--color-on-primary)]">
                  Adicionar categoria
                </span>
              </button>

              <button
                type="button"
                aria-label="Criar lista com IA"
                onClick={(e) => {
                  (e.currentTarget as HTMLButtonElement).blur();
                  setAiGenerateOpen(true);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-card)]"
              >
                <Sparkles className="h-[18px] w-[18px] text-[var(--color-ink)]" />
              </button>
            </div>

            <NewCategoryDrawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen} />

            <AiGenerateListDrawer
              open={aiGenerateOpen}
              onGenerated={handleGenerated}
              onOpenChange={setAiGenerateOpen}
            />

            <AiReviewListDrawer
              open={aiReviewOpen}
              result={aiResult}
              onOpenChange={setAiReviewOpen}
            />
          </>
        )}
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/footer.tsx
git commit -m "feat: add AI generate list button to home footer"
```

---

## Task 8: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the ✨ button appears on the home page**

Open http://localhost:3000. Confirm the ✨ button appears to the right of "Adicionar categoria" in the footer.

- [ ] **Step 3: Verify the generate drawer opens and submits**

Click ✨. The "Criar lista com IA" drawer should open. Type a prompt (ex: "lista para festa de aniversário infantil") and click "Gerar lista →". The button should show a spinner and "Gerando sua lista..." while loading.

- [ ] **Step 4: Verify the review drawer opens with generated items**

After the API returns, the generate drawer closes and the review drawer opens with the category name and list of products. Confirm you can remove items with ✕.

- [ ] **Step 5: Verify list creation and redirect**

Click "Criar lista (N itens)". Confirm the app redirects to `/category?id=<newId>` with the new category and all non-removed products visible.

- [ ] **Step 6: Verify error handling**

Temporarily set `ANTHROPIC_API_KEY` to an invalid value and retry. Confirm the toast "Não foi possível gerar a lista. Tente novamente." appears and the drawer stays open. Restore the key.

- [ ] **Step 7: Final commit if any manual fixes were needed**

```bash
git add -p
git commit -m "fix: adjust AI generate list flow after manual testing"
```
