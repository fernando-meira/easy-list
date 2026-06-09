# Category Listing — Separação Owned × Shared

**Data:** 2026-06-09  
**Escopo:** Design Pencil (PD2CM) + tela `category-card.tsx`  
**Status:** Aprovado

---

## Contexto

A tela de listagem de categorias (`/`) exibe listas do usuário e listas compartilhadas com ele num único grupo, sem distinção visual. A lógica de negócio já separa os dois tipos via `isShared: boolean` no tipo `CategoryProps`, mas o design não reflete isso.

---

## Objetivo

- Separar visualmente listas próprias de listas compartilhadas
- Listas compartilhadas devem exibir um badge com ícone `users` (Lucide) + contagem de produtos
- Seguir os tokens do design system do Pencil

---

## Estrutura de Grupos (PD2CM)

```
Categorias                          ← Page Title (Cal Sans 28px, $color.ink)

Minhas listas                       ← Section Label (Inter 14px w600, $color.ink)
  Atualizadas                       ← Sub-label (Inter 14px w500, $color.muted) — sem mudança
    [Card Praia — 13 produtos]
    [Card Teste — 4 produtos]
  Antigas                           ← Sub-label — sem mudança
    [Card Supermercado — 3 produtos]

Compartilhadas                      ← Section Label (Inter 14px w600, $color.ink)
  [Card Casa — shared badge]

[Adicionar categoria]
```

**Regras:**
- A seção "Compartilhadas" só aparece quando há ao menos uma lista compartilhada
- A seção "Minhas listas" sempre aparece (mesmo que só para mostrar o botão "Adicionar categoria")
- Sub-grupos "Atualizadas" / "Antigas" dentro de "Minhas listas" mantêm o comportamento atual (< 1 semana vs ≥ 1 semana)
- Sub-grupos só aparecem se tiverem pelo menos um card

---

## Card Compartilhado — Override Inline

Componente base: `CgRQb` (Component/Category Card)  
Abordagem: override de descendants, sem criar novo componente.

### Info Row — Product Badge substituído

O badge `p1WY50` é **substituído** (type override) por um novo frame com:

| Propriedade | Valor |
|---|---|
| Tipo | `frame` |
| Layout | `horizontal` |
| AlignItems | `center` |
| Gap | `6` |
| Fill | `$color.surface-card` |
| CornerRadius | `9999` |
| Padding | `[9, 12]` |

**Filhos do badge:**
1. Ícone `users` — library: `lucide`, 12×12px, fill: `$color.ink`
2. Texto contagem — Inter 13px, w500, `$color.ink`
3. Texto `"produtos"` — Inter 13px, w500, `$color.ink`

### Delete Row — desativada

Override `enabled: false` no nó `n0K2b` (Delete Row).  
O card shared fica com apenas a Info Row — mais compacto, sem linha cinza ou ícone de lixeira.

---

## Tokens Utilizados

| Token | Valor |
|---|---|
| `$color.ink` | `#111111` |
| `$color.muted` | `#6b7280` |
| `$color.surface-card` | `#f5f5f5` |
| `$radius.full` / `9999` | pill |
| Inter 14px w600 | labels de seção |
| Inter 14px w500 | sub-labels (existente) |

---

## Fora de Escopo

- Versão Dark Mode (PD2CM é light; versão dark é tela separada — atualizar em follow-up)
- Edição do componente `CgRQb` (mantido intacto)
- Lógica de código (`category-card.tsx`) — apenas design Pencil nesta iteração
