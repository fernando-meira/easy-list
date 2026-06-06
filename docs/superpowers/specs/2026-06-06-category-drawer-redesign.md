# Category Drawer Redesign — Spec

**Data:** 2026-06-06  
**Branch:** feat/modals  
**Referência:** `ProductManagerSheet` redesign (PR #68)

---

## Contexto

Os drawers de criação e confirmação de exclusão de categorias usam o wrapper `DrawerContent` de `@/components/ui/drawer`, que não segue o padrão visual adotado no redesign do `ProductManagerSheet` (Vaul `DrawerPrimitive` direto, Cal Sans, drag handle, botão X circular). Este redesign alinha os dois componentes com esse padrão sem adicionar funcionalidades novas.

---

## Objetivo

Substituir o wrapper `DrawerContent` por `DrawerPrimitive` direto nos dois componentes de categoria, aplicar a linguagem visual do novo `ProductManagerSheet`, e extrair o trigger do `NewCategoryDrawer` para o componente pai.

---

## Escopo

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/new-category-drawer.tsx` | Remover trigger interno → aceitar `open`/`onOpenChange` → trocar wrapper por `DrawerPrimitive` → nova linguagem visual |
| `src/components/confirm-remove-category-drawer.tsx` | Somente redesign visual — interface de props não muda |
| Componente pai do `NewCategoryDrawer` | Mover trigger "Adicionar categoria" para cá, gerenciar estado `open` |

### Sem mudanças

- `src/context/CategoryContext.tsx` — `addCategory`, `removeCategory`
- `src/types/interfaces.ts` — `CategoryProps`
- APIs de categoria

---

## Componentes

### `NewCategoryDrawer`

**Interface nova (controlado externamente):**

```tsx
interface NewCategoryDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

**Estrutura:**

```
DrawerPrimitive.Root (open, onOpenChange)
└── DrawerPrimitive.Portal
    ├── DrawerPrimitive.Overlay    — fixed inset-0 z-50 bg-black/60
    └── DrawerPrimitive.Content    — fixed inset-x-0 bottom-0 z-50
                                     rounded-t-2xl bg-background outline-none
                                     shadow-[0_-4px_12px_rgba(0,0,0,0.08)]
        ├── Drag handle            — flex justify-center pt-2.5
        │                            div w-11 h-[5px] rounded-full bg-[#d1d5db]
        └── div.px-5.pb-4.pt-4.flex.flex-col.gap-4
            ├── Header             — flex items-start justify-between
            │   ├── Bloco texto    — flex-col gap-1
            │   │   ├── Drawer.Title    — "Nova categoria"
            │   │   └── Drawer.Description — "Digite o nome e a categoria fica disponível imediatamente."
            │   └── Botão X        — h-9 w-9 rounded-full border border-border
            │                        flex-shrink-0, aria-label="Fechar"
            │                        bg-white dark:border-[#242424] dark:bg-[#101010]
            └── form.flex.flex-col.gap-4
                ├── Campo Nome
                │   ├── span "Categoria" — text-[13px] font-bold text-foreground
                │   └── Input — h-10 rounded-lg px-3.5 text-base font-semibold
                │               required, placeholder="Nome da categoria"
                ├── Botão submit   — h-10 w-full rounded-lg bg-foreground text-background
                │                    text-sm font-semibold, Plus icon + "Criar categoria"
                └── Helper text   — text-[13px] font-medium text-[#898989]
                                    "Enter também cria quando o nome estiver preenchido."
```

**Tipografia:**
- Título: Cal Sans (`font-sans`), 28px, font-semibold, leading-[1.2], tracking-[-0.5px]
- Descrição: text-sm, leading-[1.5], text-[#374151] dark:text-[#a1a1aa]
- Label do campo: text-[13px] font-bold
- Helper text: text-[13px] font-medium text-[#898989]

**Comportamento:**
- `onSubmit`: chama `addCategory(data)`, `methods.reset()`, `onOpenChange?.(false)`
- Enter no campo nome submete o formulário (comportamento nativo do `<form>`)

**Trigger (movido para o pai):**

O botão "Adicionar categoria" que estava dentro do componente é extraído para o componente pai. O pai gerencia `open` e `setOpen`. O botão mantém exatamente o mesmo estilo atual:

```tsx
<button
  onClick={() => setOpen(true)}
  className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
  aria-label="Adicionar categoria"
>
  <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
  <span className="text-sm font-semibold text-[var(--color-on-primary)]">
    Adicionar categoria
  </span>
</button>
```

---

### `ConfirmRemoveCategoryDrawer`

**Interface — sem mudança:**

```tsx
interface ConfirmRemoveCategoryDrawerProps {
  open: boolean;
  category?: CategoryProps;
  onOpenChange: (open: boolean) => void;
}
```

**Estrutura:**

```
DrawerPrimitive.Root (open, onOpenChange)
└── DrawerPrimitive.Portal
    ├── DrawerPrimitive.Overlay    — fixed inset-0 z-50 bg-black/60
    └── DrawerPrimitive.Content    — fixed inset-x-0 bottom-0 z-50
                                     rounded-t-2xl bg-background outline-none
                                     shadow-[0_-4px_12px_rgba(0,0,0,0.08)]
        ├── Drag handle            — mesmo padrão do NewCategoryDrawer
        └── div.px-5.pb-4.pt-4.flex.flex-col.gap-4
            ├── Header             — flex items-start justify-between
            │   ├── Bloco texto
            │   │   ├── Drawer.Title       — category.name (Cal Sans 28px)
            │   │   └── Drawer.Description — "Tem certeza que deseja remover esta categoria?"
            │   └── Botão X        — mesmo padrão do NewCategoryDrawer
            ├── Card de aviso      — rounded-xl bg-[#f5f5f5] dark:bg-[#1a1a1a]
            │                        border border-border dark:border-[#242424] p-3
            │                        text-sm font-medium text-foreground
            │                        "Esta ação não pode ser desfeita."
            └── Botão de exclusão  — h-10 w-full rounded-lg
                                     bg-[var(--color-error)] text-white
                                     text-sm font-semibold
                                     Trash icon + "Remover [category.name]"
```

**Comportamento — sem mudança:**
- `handleRemoveCategory`: chama `removeCategory(category._id)`, `onOpenChange(false)`
- Toast de erro se `category` for undefined (já existente)
- Renderização condicional `category &&` mantida

---

## Dark mode

Mesmos tokens do `ProductManagerSheet`:

| Elemento | Light | Dark |
|---|---|---|
| Sheet bg | `bg-background` (`#ffffff`) | `bg-background` (`#101010`) |
| Overlay | `bg-black/60` | `bg-black/60` |
| Botão X bg | `bg-white` | `dark:bg-[#101010]` |
| Botão X border | `border-border` | `dark:border-[#242424]` |
| Card aviso bg | `bg-[#f5f5f5]` | `dark:bg-[#1a1a1a]` |
| Descrição | `text-[#374151]` | `dark:text-[#a1a1aa]` |

---

## O que não muda

- Lógica de `addCategory` e `removeCategory`
- Validação (campo `name` obrigatório no `NewCategoryDrawer`)
- Toast de sucesso/erro (gerenciado pelo `CategoryContext`)
- `CategoryProps` interface
- Endpoints de API

---

## Critérios de conclusão

- [ ] `NewCategoryDrawer` aceita `open`/`onOpenChange` e não tem trigger interno
- [ ] Trigger "Adicionar categoria" funciona no componente pai
- [ ] Bottom sheet de criação abre/fecha com drag to dismiss
- [ ] Título "Nova categoria" em Cal Sans 28px
- [ ] Campo de nome submete com Enter
- [ ] `ConfirmRemoveCategoryDrawer` usa `DrawerPrimitive` com nova linguagem visual
- [ ] Título do drawer de exclusão exibe `category.name` em Cal Sans 28px
- [ ] Card de aviso "Esta ação não pode ser desfeita." visível
- [ ] Dark mode correto em ambos os drawers
- [ ] `npx tsc --noEmit` passa sem erros
