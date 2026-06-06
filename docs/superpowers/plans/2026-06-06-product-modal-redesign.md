# Product Modal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o `ProductManagerSheet` (Radix Dialog, painel lateral) por um bottom sheet (Vaul) com os três novos sub-componentes definidos no redesign.

**Architecture:** Opção C — extrair `UnitSegmentedControl`, `CartToggleRow` e `CategoryPopover` como componentes independentes primeiro, depois refatorar o `ProductManagerSheet` para usar Vaul e esses blocos. Toda lógica de negócio existente (react-hook-form, ProductContext, APIs) permanece intacta.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, react-hook-form, Vaul (drawer), Radix UI DropdownMenu, Lucide React.

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Criar | `src/components/ui/unit-segmented-control.tsx` |
| Criar | `src/components/ui/cart-toggle-row.tsx` |
| Criar | `src/components/category-popover.tsx` |
| Modificar | `src/components/product-manager-sheet.tsx` |

Sem mudanças em: contextos, APIs, `category-client.tsx`, `product-row.tsx`, `currency-input.tsx`.

---

## Contexto de referência rápida

```ts
// src/types/enums.tsx
enum UnitEnum { unit = 'uni.', kg = 'kg', grams = 'g.' }
enum AddOrEditProductTypeEnum { add = 'add', edit = 'edit' }
```

```ts
// src/lib/utils.ts
export function cn(...inputs: ClassValue[]): string
```

Cal Sans é o `font-sans` padrão do projeto (ver `tailwind.config.ts`). Não requer classe especial.

---

## Task 1: UnitSegmentedControl

**Files:**
- Criar: `src/components/ui/unit-segmented-control.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// src/components/ui/unit-segmented-control.tsx
'use client';

import { cn } from '@/lib/utils';
import { UnitEnum } from '@/types/enums';

const UNIT_OPTIONS = [
  { label: 'Un.', value: UnitEnum.unit },
  { label: 'Kg',  value: UnitEnum.kg },
  { label: 'Gr',  value: UnitEnum.grams },
] as const;

interface UnitSegmentedControlProps {
  value: string;
  onChange: (value: UnitEnum) => void;
}

export function UnitSegmentedControl({ value, onChange }: UnitSegmentedControlProps) {
  return (
    <div className="flex w-full gap-2">
      {UNIT_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-1 items-center justify-center rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors',
              isSelected
                ? 'border-border bg-white text-[#111111]'
                : 'border-border bg-[#f8f9fa] text-[#374151] dark:border-[#242424] dark:bg-[#1a1a1a] dark:text-[#a1a1aa]'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Checar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/unit-segmented-control.tsx
git commit -m "feat: add UnitSegmentedControl component"
```

---

## Task 2: CartToggleRow

**Files:**
- Criar: `src/components/ui/cart-toggle-row.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// src/components/ui/cart-toggle-row.tsx
'use client';

import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartToggleRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function CartToggleRow({ checked, onCheckedChange }: CartToggleRowProps) {
  return (
    <div className="flex h-14 items-center justify-between rounded-xl border border-border bg-background px-3.5">
      <div className="flex items-center gap-2.5">
        <ShoppingCart
          className="h-[22px] w-[22px] flex-shrink-0 transition-colors"
          style={{ color: checked ? '#10b981' : '#fb923c' }}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-[750] leading-[1.35] text-foreground">
            {checked ? 'Produto no carrinho' : 'Adicionar direto ao carrinho'}
          </span>
          <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
            {checked ? 'Ativado' : 'Desativado por padrão'}
          </span>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative flex h-[30px] w-[52px] flex-shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors',
          checked ? 'bg-[#10b981]' : 'bg-[#e5e7eb]'
        )}
      >
        <span
          className={cn(
            'h-6 w-6 flex-shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Checar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/cart-toggle-row.tsx
git commit -m "feat: add CartToggleRow component"
```

---

## Task 3: CategoryPopover

**Files:**
- Criar: `src/components/category-popover.tsx`

Usa `DropdownMenu` do Radix UI (já instalado: `@radix-ui/react-dropdown-menu`).

- [ ] **Step 1: Criar o componente**

```tsx
// src/components/category-popover.tsx
'use client';

import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CategoryProps } from '@/types/interfaces';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CategoryPopoverProps {
  value: string;
  onChange: (id: string) => void;
  categories: CategoryProps[];
}

export function CategoryPopover({ value, onChange, categories }: CategoryPopoverProps) {
  const selected = categories.find((c) => c._id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-[#f5f5f5] px-3.5 dark:border-[#242424] dark:bg-[#1a1a1a]"
        >
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
              Categoria
            </span>
            <span className="text-base font-bold leading-[1.35] text-foreground">
              {selected?.name ?? '—'}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-2 dark:border-[#242424] dark:bg-[#101010]">
            <span className="text-sm font-bold leading-[1.35] text-foreground">Trocar</span>
            <ChevronDown className="h-[15px] w-[15px] text-foreground" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        {categories.map((category) => (
          <DropdownMenuItem
            key={category._id}
            className={cn('flex items-center gap-2', value === category._id && 'font-bold')}
            onSelect={() => onChange(category._id)}
          >
            {value === category._id ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <span className="h-4 w-4 flex-shrink-0" />
            )}
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Checar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/category-popover.tsx
git commit -m "feat: add CategoryPopover component"
```

---

## Task 4: Refatorar ProductManagerSheet

**Files:**
- Modificar: `src/components/product-manager-sheet.tsx`

Substituir `DialogPrimitive` por `DrawerPrimitive` (Vaul) e montar o formulário com os novos sub-componentes. A interface de props, o `useForm`, o `useEffect` de fetch/reset e a lógica de `managerProduct` permanecem idênticos.

**Nota sobre `CurrencyInput`:** O componente recebe `label` como prop e renderiza o label internamente. No novo design, o label "Preço" é renderizado fora do componente. Passe `label=""` no `CurrencyInput` para suprimir o label interno; se renderizar um `<label>` vazio, adicione a prop `hideLabel` ou remova a renderização condicional dentro de `currency-input.tsx` (verificar no momento da implementação).

- [ ] **Step 1: Substituir a implementação completa**

```tsx
// src/components/product-manager-sheet.tsx
'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useForm, FormProvider } from 'react-hook-form';
import { X, Check, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCategories } from '@/context';
import { Input } from '@/components/ui/input';
import { ProductProps } from '@/types/interfaces';
import { useProducts } from '@/context/ProductContext';
import { UnitEnum, AddOrEditProductTypeEnum } from '@/types/enums';
import { CartToggleRow } from '@/components/ui/cart-toggle-row';
import { UnitSegmentedControl } from '@/components/ui/unit-segmented-control';

import { CurrencyInput } from './currency-input';
import { CategoryPopover } from './category-popover';

interface ProductManagerSheetProps {
  open?: boolean;
  product?: ProductProps;
  type?: AddOrEditProductTypeEnum;
  onOpenChange?: (open: boolean) => void;
}

export const ProductManagerSheet = ({
  open,
  type,
  product,
  onOpenChange,
}: ProductManagerSheetProps) => {
  const { managerProduct, isProductLoading } = useProducts();
  const { categories, selectedCategoryId, isLoadingCategories } = useCategories();

  const isEdit = type === AddOrEditProductTypeEnum.edit;

  const methods = useForm<Omit<ProductProps, 'category'> & { categoryId: string }>({
    defaultValues: {
      name: '',
      price: '',
      quantity: '',
      addToCart: false,
      unit: UnitEnum.unit,
      categoryId:
        selectedCategoryId ||
        product?.category?._id ||
        product?.categoryId ||
        categories[0]?._id ||
        '',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    managerProduct({ product: { ...data, categoryId: data.categoryId } });
    methods.reset();
    onOpenChange?.(false);
  });

  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);

  const fetchProduct = React.useCallback(
    async (productId: string) => {
      try {
        setIsLoadingProduct(true);
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        methods.reset({
          _id: data._id,
          name: data.name,
          unit: data.unit,
          price: data.price,
          quantity: data.quantity,
          addToCart: data.addToCart,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          categoryId: selectedCategoryId || data.category?._id,
        });
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoadingProduct(false);
      }
    },
    [methods, selectedCategoryId]
  );

  React.useEffect(() => {
    if (!open) return;

    if (product?._id && isEdit) {
      fetchProduct(product._id);
    }

    if (!isEdit && categories.length > 0) {
      methods.reset(
        {
          name: '',
          price: '',
          quantity: '1',
          addToCart: false,
          unit: UnitEnum.unit,
          categoryId: selectedCategoryId,
        },
        { keepDefaultValues: true }
      );
    }
  }, [open, product?._id, isEdit, categories.length, fetchProduct, categories, methods, selectedCategoryId]);

  const [unit, categoryId, addToCart] = methods.watch(['unit', 'categoryId', 'addToCart']);

  const isLoading = isLoadingCategories || isProductLoading.isLoading || isLoadingProduct;

  const quantityLabel = unit === UnitEnum.unit || !unit ? 'Qtd.' : 'Peso';

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'
          )}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 flex-shrink-0">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-4 pt-4">
            {/* Sheet header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  {isEdit ? 'Editar produto' : 'Novo produto'}
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  {isEdit
                    ? 'Ajuste só o necessário e salve.'
                    : 'Digite o nome agora; detalhes podem ficar para depois.'}
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

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <FormProvider {...methods}>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  {/* Campo Produto */}
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

                  {/* Categoria */}
                  <CategoryPopover
                    value={categoryId}
                    categories={categories}
                    onChange={(id) =>
                      methods.setValue('categoryId', id, { shouldValidate: true })
                    }
                  />

                  {/* Detalhes opcionais */}
                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-[750] leading-[1.35] text-foreground">
                        Detalhes opcionais
                      </span>
                      <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
                        pode preencher depois
                      </span>
                    </div>

                    {/* Preço + Qtd */}
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
                          placeholder={quantityLabel}
                          className="h-10 rounded-lg px-3.5"
                          {...methods.register('quantity')}
                        />
                      </div>
                    </div>

                    <UnitSegmentedControl
                      value={unit || UnitEnum.unit}
                      onChange={(val) => methods.setValue('unit', val)}
                    />
                  </div>

                  {/* Cart toggle */}
                  <CartToggleRow
                    checked={!!addToCart}
                    onCheckedChange={(val) => methods.setValue('addToCart', val)}
                  />

                  {/* Footer */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
                    >
                      {isEdit ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      {isEdit ? 'Salvar alterações' : 'Adicionar produto'}
                    </button>

                    <p className="text-[13px] font-medium leading-[1.4] text-[#898989]">
                      {isEdit
                        ? 'As alterações atualizam esta lista imediatamente.'
                        : 'Enter também salva quando o nome estiver preenchido.'}
                    </p>
                  </div>
                </form>
              </FormProvider>
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};
```

- [ ] **Step 2: Verificar prop `label` de `CurrencyInput`**

Abrir `src/components/currency-input.tsx`. Se `label` é renderizado incondicionalmente (ex: `<label>{label}</label>`), adicionar renderização condicional:

```tsx
// dentro de currency-input.tsx — só renderizar se label não for vazio
{label && <label htmlFor={id}>{label}</label>}
```

Se `label` já é opcional ou a renderização já é condicional, nenhuma mudança necessária.

- [ ] **Step 3: Checar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros. Se houver erro de tipo em `unit` watch (pode ser `UnitEnum | undefined`), ajustar para `(unit as UnitEnum) || UnitEnum.unit`.

- [ ] **Step 4: Subir o servidor e testar o fluxo de adição**

```bash
npm run dev
```

1. Navegar até uma categoria com produtos.
2. Clicar em "Adicionar produto" (sticky footer).
3. Verificar: sheet sobe da base com animação, drag handle visível, título "Novo produto" em Cal Sans 28px.
4. Preencher nome → clicar "Adicionar produto" → produto aparece na lista.
5. Puxar o sheet para baixo (drag to dismiss) → sheet fecha.

- [ ] **Step 5: Testar o fluxo de edição**

1. Clicar no botão de editar em um produto existente.
2. Verificar: sheet abre com dados do produto preenchidos, título "Editar produto".
3. Alterar o nome → clicar "Salvar alterações" → produto atualiza na lista.
4. Testar troca de categoria: clicar "Trocar" → dropdown lista categorias → selecionar outra → salvar → produto move para nova categoria.

- [ ] **Step 6: Testar sub-componentes dentro do sheet**

1. **UnitSegmentedControl:** clicar em "Kg" → botão fica selecionado (branco), label de quantidade muda para "Peso".
2. **CartToggleRow:** clicar no toggle → muda para verde, ícone do carrinho fica verde, texto muda para "Produto no carrinho".
3. **CategoryPopover:** clicar "Trocar" → dropdown abre com lista de categorias, categoria atual tem check e texto bold.

- [ ] **Step 7: Verificar dark mode**

Alternar para dark mode (botão de tema no header). Verificar:
- Sheet com fundo `#101010`
- Inputs com borda `#242424`
- Seção "Detalhes opcionais" com fundo `#1a1a1a`
- UnitSegmentedControl: opção não selecionada com fundo `#1a1a1a` e texto `#a1a1aa`
- CartToggleRow: borda dark visível

- [ ] **Step 8: Commit**

```bash
git add src/components/product-manager-sheet.tsx src/components/currency-input.tsx
git commit -m "feat: replace Dialog with Vaul bottom sheet in ProductManagerSheet"
```

---

## Checklist de conclusão

- [ ] Sheet abre/fecha nos dois modos (add e edit)
- [ ] Drag to dismiss funciona
- [ ] `UnitSegmentedControl` atualiza `unit` no form e muda label de quantidade
- [ ] `CartToggleRow` atualiza `addToCart`, muda cor do ícone, posição do knob e texto
- [ ] `CategoryPopover` lista categorias, fecha ao selecionar, atualiza `categoryId`
- [ ] Produto editado com nova categoria move para a categoria correta na listagem
- [ ] Título usa Cal Sans 28px (font-sans do projeto)
- [ ] Dark mode correto nos três sub-componentes e no sheet
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npm run lint` passa sem erros
