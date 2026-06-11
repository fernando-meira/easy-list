# AI Product Quantity/Unit Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a IA extrair quantidade e unidade de medida do nome do produto, preenchendo os campos correspondentes no cadastro em vez de incluí-los no título.

**Architecture:** O system prompt é expandido para que Claude retorne `quantity?` e `unit?` por produto, limpando o nome. O servidor normaliza o campo `unit` para os valores do `UnitEnum` existente. O drawer de revisão exibe os campos extraídos com edição inline antes de criar os produtos.

**Tech Stack:** Next.js 14, TypeScript, Anthropic SDK, Firebase, React

---

## File Map

| Arquivo | O que muda |
|---|---|
| `src/types/interfaces.ts` | Expande `AiGeneratedList.products` com `quantity?` e `unit?` |
| `src/app/api/ai/generate-list/route.ts` | Adiciona `normalizeUnit`, atualiza system prompt e tipo de retorno de `callClaude` |
| `src/components/ai-review-list-drawer.tsx` | Atualiza estado, cards editáveis inline, payload de criação |

---

## Task 1: Expandir a interface `AiGeneratedList`

**Files:**
- Modify: `src/types/interfaces.ts`

- [ ] **Step 1: Atualizar a interface**

Substituir o conteúdo de `src/types/interfaces.ts` por:

```ts
export interface CategoryProps {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  products?: Array<ProductProps>;
  isShared?: boolean;
}

export interface ProductProps {
  name: string;
  _id?: string;
  unit?: string;
  price?: string;
  barcode?: string;
  createdAt: string;
  quantity?: string;
  updatedAt: string;
  addToCart?: boolean;
  categoryId?: string;
  category?: CategoryProps;
}

export interface AiGeneratedList {
  categoryName: string;
  products: {
    name: string;
    unit?: string;
    quantity?: string;
  }[];
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros relacionados a `AiGeneratedList`.

- [ ] **Step 3: Commit**

```bash
git add src/types/interfaces.ts
git commit -m "feat: expand AiGeneratedList products with quantity and unit fields"
```

---

## Task 2: Atualizar a rota da IA — `normalizeUnit` + system prompt + tipo de retorno

**Files:**
- Modify: `src/app/api/ai/generate-list/route.ts`

- [ ] **Step 1: Substituir o arquivo inteiro por:**

```ts
import { getToken } from 'next-auth/jwt';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

import { UnitEnum } from '@/types/enums';
import { authSecret } from '@/lib/auth-secret';
import { AiGeneratedList } from '@/types/interfaces';
import { getUserHistoryForAI } from '@/lib/firestore-domain';

const client = new Anthropic();

const UNIT_MAP: Record<string, UnitEnum> = {
  g: UnitEnum.grams,
  kg: UnitEnum.kg,
  uni: UnitEnum.unit,
};

function normalizeUnit(raw?: string): UnitEnum | undefined {
  if (!raw) return undefined;
  return UNIT_MAP[raw.toLowerCase()] ?? UnitEnum.unit;
}

function buildSystemPrompt(history: { name: string; products: string[] }[]): string {
  const base = `Você é um assistente de lista de compras.
Responda APENAS com JSON válido, sem texto adicional, no formato:
{ "categoryName": string, "products": [{ "name": string, "quantity"?: string, "unit"?: "kg" | "g" | "uni" }] }

Gere entre 8 e 15 produtos por padrão, adequados ao contexto do pedido.
Os nomes devem estar em português do Brasil.

Regras de extração de quantidade e unidade:
- Extraia quantidade e unidade do nome quando houver (ex: "1kg" → name:"Carne suína lombo em bifes", quantity:"1", unit:"kg")
- Limpe o nome: remova a parte da quantidade/unidade extraída do campo name
- Use apenas "kg", "g" ou "uni" para o campo unit
- Para ml, l, litros, unidades, itens, pacotes → use "uni"
- Ex: "10 unidades" → quantity:"10", unit:"uni"
- Se não houver quantidade explícita, omita os campos quantity e unit`;

  if (history.length === 0) return base;

  const lines = history.map((c) => `- ${c.name}: ${c.products.join(', ')}`).join('\n');

  return `${base}

Histórico de compras do usuário:
${lines}

Use esse histórico como referência de preferências, mas adapte ao pedido atual.`;
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<AiGeneratedList> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

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

    let result: AiGeneratedList;

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

    const normalized: AiGeneratedList = {
      ...result,
      products: result.products.map((p) => ({
        ...p,
        unit: normalizeUnit(p.unit),
      })),
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao gerar lista com IA' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/generate-list/route.ts
git commit -m "feat: extract quantity and unit from AI-generated product names"
```

---

## Task 3: Atualizar `AiReviewListDrawer` — estado, cards editáveis e payload

**Files:**
- Modify: `src/components/ai-review-list-drawer.tsx`

- [ ] **Step 1: Substituir o arquivo inteiro por:**

```tsx
'use client';

import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { UnitEnum } from '@/types/enums';
import { useCategories } from '@/context';
import { AiGeneratedList } from '@/types/interfaces';
import { LoadingSpinner } from '@/components/loading-spinner';
import { UnitSegmentedControl } from '@/components/ui/unit-segmented-control';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

type AiProduct = AiGeneratedList['products'][0];

interface AiReviewListDrawerProps {
  open?: boolean;
  result: AiGeneratedList | null;
  onOpenChange?: (open: boolean) => void;
}

export function AiReviewListDrawer({ open, result, onOpenChange }: AiReviewListDrawerProps) {
  const router = useRouter();
  const { markLocalMutation } = useCategories();
  const [products, setProducts] = useState<AiProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProducts(result?.products ?? []);
  }, [result]);

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, updates: Partial<AiProduct>) => {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
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
        const productResponse = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: product.name,
            categoryId: category._id,
            ...(product.unit ? { unit: product.unit } : {}),
            ...(product.quantity ? { quantity: product.quantity } : {}),
          }),
        });

        if (!productResponse.ok) throw new Error('Failed to create product');
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
    <ResponsiveProductDialog
      open={open}
      title={result?.categoryName ?? 'Lista gerada'}
      description={`${products.length} ${products.length === 1 ? 'item gerado' : 'itens gerados'}`}
      onOpenChange={onOpenChange}
      footer={(
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex h-10 w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
        >
          {isSaving ? <LoadingSpinner size={16} /> : buttonLabel}
        </button>
      )}
    >
      <div className="flex flex-col gap-2 overflow-y-auto">
        {products.map((product, index) => {
          const hasExtracted = product.quantity !== undefined || product.unit !== undefined;

          return (
            <div
              key={index}
              className={cn(
                'flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3',
                hasExtracted ? 'gap-2 py-3' : 'h-[68px] justify-center'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="truncate text-[15px] font-semibold text-[var(--color-ink)]">
                    {product.name}
                  </span>
                </div>

                <div className="flex h-[34px] flex-shrink-0 items-center">
                  <button
                    type="button"
                    aria-label={`Remover ${product.name}`}
                    onClick={() => removeProduct(index)}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--color-surface-card)]"
                  >
                    <Trash2 className="h-[15px] w-[15px] text-[var(--color-error)]" />
                  </button>
                </div>
              </div>

              {hasExtracted && (
                <div className="flex items-center gap-2">
                  <input
                    min={0}
                    step={0.1}
                    type="number"
                    inputMode="decimal"
                    placeholder="Qtd."
                    value={product.quantity ?? ''}
                    onChange={(e) => updateProduct(index, { quantity: e.target.value })}
                    className="h-8 w-20 rounded-lg border border-input bg-background px-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <UnitSegmentedControl
                    value={(product.unit as UnitEnum) ?? UnitEnum.unit}
                    onChange={(val) => updateProduct(index, { unit: val })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ResponsiveProductDialog>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/components/ai-review-list-drawer.tsx
git commit -m "feat: show and edit extracted quantity/unit in AI review drawer"
```

---

## Task 4: Teste manual end-to-end

- [ ] **Step 1: Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

- [ ] **Step 2: Testar extração com unidade explícita**

Abrir a aplicação → "Criar lista com IA" → digitar: `lista de churrasco para 10 pessoas`

Verificar no drawer de revisão:
- Produtos com quantidade explícita (ex: "Picanha 1kg") aparecem com nome limpo + input de quantidade preenchido + unidade selecionada
- Produtos sem quantidade ficam com card compacto (sem segunda linha)
- Input de quantidade é editável
- Segmented control de unidade é clicável

- [ ] **Step 3: Testar extração com "unidades/itens"**

Digitar: `lista de material escolar para 1 aluno`

Verificar: produtos como "10 lápis" → name:"lápis", quantity:"10", unit:"uni."

- [ ] **Step 4: Verificar persistência no Firestore**

Confirmar a lista → navegar para a categoria criada → abrir um produto que tinha quantidade → verificar que `quantity` e `unit` estão preenchidos na tela de edição do produto.

- [ ] **Step 5: Testar remoção de produto**

No drawer de revisão, remover um produto com segunda linha → confirmar que a lista restante está correta.
