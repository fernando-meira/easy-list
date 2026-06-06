# Product Modal Redesign — Spec

**Data:** 2026-06-06  
**Branch:** feat/modals  
**Design:** EasyList.pen — nodes JCrCx, OSzM3, NQecW, XBG5M

---

## Contexto

O `ProductManagerSheet` atual usa `DialogPrimitive` do Radix UI como painel lateral deslizante da direita. O redesign substitui esse padrão por um **Bottom Sheet** (Vaul) universal — mesmo comportamento em mobile e desktop. O novo design também introduz três padrões visuais inexistentes no código atual: segmented control de unidade, toggle iOS-style para carrinho, e seletor de categoria via popover.

---

## Objetivo

Implementar os novos modais de adição e edição de produto conforme o design aprovado, mantendo toda a lógica de negócio existente (react-hook-form, ProductContext, CategoryContext, APIs).

---

## Arquitetura

### Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `src/components/ui/unit-segmented-control.tsx` | Botões Un./Kg/Gr — controlado pelo form |
| `src/components/ui/cart-toggle-row.tsx` | Toggle iOS-style com ícone e labels |
| `src/components/category-popover.tsx` | Chip de categoria + popover com lista |

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/product-manager-sheet.tsx` | Substituir DialogPrimitive → Vaul Drawer; montar form com novos sub-componentes |
| `src/app/layout.tsx` | Adicionar Cal Sans via `next/font` se não presente |

### Arquivos sem mudança

- `src/context/ProductContext.tsx` — `managerProduct`, `toggleCart`, `removeProduct`
- `src/context/CategoryContext.tsx` — estado de categorias
- `src/components/currency-input.tsx` — input de preço
- `src/app/category/category-client.tsx` — triggers `addSheetOpen` / `editSheetOpen`
- `src/components/product-row.tsx` — botão de edição
- Todos os endpoints de API

---

## Componentes

### `UnitSegmentedControl`

```tsx
interface UnitSegmentedControlProps {
  value: string        // 'uni.' | 'kg' | 'g.'
  onChange: (value: string) => void
}
```

- Row com gap 8px, fill_container de largura
- 3 botões: "Un." / "Kg" / "Gr" — labels de exibição mapeados para os valores internos do enum atual (`UnitEnum`)
- **Selecionado:** bg branco, texto `#111111`, borda `#e5e7eb`
- **Não selecionado:** bg `#f8f9fa`, texto `#374151`, borda `#e5e7eb`
- Dark mode: selecionado bg branco texto `#111111`; não selecionado bg `#1a1a1a` texto `#a1a1aa` borda `#242424`
- Substitui o `<Select>` de unidade existente no form

### `CartToggleRow`

```tsx
interface CartToggleRowProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}
```

- Container: height 56, cornerRadius 12, padding `[0, 14]`, borda `#e5e7eb`
- **Esquerda:** ícone `shopping-cart` (lucide) + coluna de texto
  - Ícone: `#fb923c` quando off, `#10b981` quando on
  - Título: "Adicionar direto ao carrinho" (add) / "Produto no carrinho" (edit, quando on)
  - Subtítulo: "Desativado por padrão" (off) / "Ativado" (on)
- **Direita:** toggle 52×30px, pill (`borderRadius: 9999`)
  - OFF: fill `#e5e7eb`, knob à esquerda
  - ON: fill `#10b981`, knob à direita
  - Knob: ellipse 24×24, fill branco, shadow `y:1 blur:3`
- Substitui o `<Checkbox>` de `addToCart` existente

### `CategoryPopover`

```tsx
interface CategoryPopoverProps {
  value: string                  // categoryId selecionado
  onChange: (id: string) => void
  categories: CategoryProps[]
}
```

- **Trigger (chip):** row height 48, cornerRadius 12, bg `#f5f5f5`, padding `[0, 14]`, borda `#e5e7eb`
  - Esquerda: label "Categoria" (muted, 12px) + nome da categoria atual (bold, 16px)
  - Direita: botão "Trocar" + `chevron-down` (pill, borda, padding `[8, 10]`)
- **Popover content:** lista de todas as categorias
  - Item selecionado: `check` icon à esquerda + texto bold
  - Itens não selecionados: texto normal, sem ícone
  - Ao clicar: fecha popover, chama `onChange(categoryId)`
- Usa `Popover` + `PopoverTrigger` + `PopoverContent` do Radix UI
- Comportamento de troca de categoria na submissão: já tratado pelo `managerProduct` no `ProductContext` (move produto entre categorias quando `categoryId` muda)

---

## Bottom Sheet (`product-manager-sheet.tsx`)

### Estrutura

```
Drawer.Root (open, onOpenChange, shouldScaleBackground)
└── Drawer.Portal
    ├── Drawer.Overlay          — bg rgba(0,0,0,0.6)
    └── Drawer.Content          — sheet principal
        ├── Drag Handle         — div 44×5px, bg #d1d5db, mx-auto, borderRadius pill
        ├── Sheet Header        — flex space-between
        │   ├── Bloco de texto  — título + subtítulo
        │   └── Botão X         — 36×36, circular, borda
        └── FormProvider (react-hook-form)
            └── <form onSubmit>
                ├── Campo Produto   — label + Input
                ├── CategoryPopover
                ├── Optional Details card
                │   ├── Header "Detalhes opcionais"
                │   ├── Row Preço + Qtd
                │   └── UnitSegmentedControl
                ├── CartToggleRow
                └── Sheet Footer
                    ├── Botão submit (ActionButton ou <button> direto)
                    └── Helper text
```

### Modos add vs. edit

| Elemento | Add | Edit |
|---|---|---|
| Título | "Novo produto" | "Editar produto" |
| Subtítulo | "Digite o nome agora; detalhes podem ficar para depois." | "Ajuste só o necessário e salve." |
| Submit icon | `plus` | `check` |
| Submit label | "Adicionar produto" | "Salvar alterações" |
| Helper text | "Enter também salva quando o nome estiver preenchido." | "As alterações atualizam esta lista imediatamente." |
| CartToggleRow estado inicial | OFF | Reflete `product.addToCart` |

### Tipografia

- Título: **Cal Sans**, 28px, weight 600, letterSpacing -0.5px, lineHeight 1.2
- Subtítulo: Inter, 14px, normal, lineHeight 1.5
- Labels de campo: Inter, 13px, weight 700
- Valores de input: Inter, 16px, weight 600
- Helper text: Inter, 13px, weight 500, cor `#898989`

Cal Sans já está carregada via `@import` no `globals.css` e disponível através da variável `--font-display`. Nenhuma mudança necessária em `layout.tsx`.

### Dimensões e espaçamento

- Sheet: `cornerRadius: 16px` apenas nos cantos superiores
- Sheet padding: `10px 20px 16px 20px` (topo menor para o drag handle)
- Gap interno entre seções: `16px`
- Optional Details card: cornerRadius 12, padding 12, bg `#f5f5f5`
- Inputs: height 40px, cornerRadius 8, padding horizontal 14px

### Animação

Vaul já lida com a animação de entrada/saída (slide from bottom). Nenhuma animação custom necessária.

---

## Estado do formulário

Nenhuma mudança na estrutura do `useForm`. Os campos mapeados:

| Campo | Componente | Tipo |
|---|---|---|
| `name` | `<Input>` | string |
| `categoryId` | `CategoryPopover` | string |
| `price` | `CurrencyInput` | string |
| `quantity` | `<Input>` | string |
| `unit` | `UnitSegmentedControl` | `'uni.' \| 'kg' \| 'g.'` |
| `addToCart` | `CartToggleRow` | boolean |

O `useEffect` de reset/fetch ao abrir o sheet permanece inalterado.

---

## Dark mode

O projeto já tem variáveis CSS que cobrem todos os valores do design:

| Token do design | Variável CSS | Valor |
|---|---|---|
| Bg sheet light | `--color-canvas` | `#ffffff` |
| Bg sheet dark | `--color-surface-dark` | `#101010` |
| Bg card dark | `--color-surface-dark-elevated` | `#1a1a1a` |
| Bg card light | `--color-surface-card` | `#f5f5f5` |
| Bg input não selecionado | `--color-surface-soft` | `#f8f9fa` |
| Borda | `--color-hairline` | `#e5e7eb` |
| Texto principal | `--color-ink` | `#111111` |
| Texto muted | `--color-muted` | `#6b7280` |
| Toggle ON / success | `--color-success` | `#10b981` |
| Fonte display (Cal Sans) | `--font-display` | `Cal Sans, Inter, sans-serif` |

Todos os componentes novos devem referenciar essas variáveis via classes Tailwind para que o dark mode funcione automaticamente.

---

## O que não muda

- Lógica de `managerProduct` — create/update/move entre categorias
- Validação de campos (required no `name` e `categoryId`)
- `CurrencyInput` — formato BRL, inputMode numeric
- Triggers de abertura: `setAddSheetOpen(true)` / `setEditSheetOpen(true)` em `category-client.tsx`
- Props da interface: `open`, `product`, `type`, `onOpenChange`
- Endpoints de API (`/api/products`)

---

## Critérios de conclusão

- [ ] Bottom sheet abre/fecha corretamente nos dois modos (add e edit)
- [ ] Drag to dismiss funciona
- [ ] `UnitSegmentedControl` atualiza o campo `unit` no form
- [ ] `CartToggleRow` atualiza o campo `addToCart` e muda visual (cor do ícone, posição do knob, texto)
- [ ] `CategoryPopover` lista todas as categorias, fecha ao selecionar, atualiza `categoryId`
- [ ] Produto editado com nova categoria é movido corretamente na listagem
- [ ] Cal Sans aplicada no título do sheet
- [ ] Dark mode visual correto nos três sub-componentes e no sheet
- [ ] Submit funciona com Enter quando `name` preenchido
- [ ] Toast de sucesso/erro mantido
