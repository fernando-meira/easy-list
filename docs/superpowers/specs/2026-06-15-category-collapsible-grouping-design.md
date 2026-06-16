# Design: Categorização Colapsável + Botão Remover Agrupamento

**Data:** 2026-06-15
**Status:** Aprovado

---

## Contexto

A lista de produtos já suporta organização em subcategorias via IA (`/api/ai/organize-list`). O campo `subcategoryOrder: string[]` na categoria controla se a exibição está agrupada; produtos têm `subcategory?: string`. Quando `subcategoryOrder` não existe, a lista é exibida de forma plana.

---

## Funcionalidades

### 1. Botão "Remover Agrupamento"

**Localização:** `CategoryHeroCard` — inline com o botão "Organizar lista", icon-only, variante `ghost`, padrão visual dos botões de edição/deleção de produto.

**Ícone:** `ListX` (lucide-react) — comunica "remover lista organizada".

**Visibilidade:** Renderizado **apenas** quando `category.subcategoryOrder?.length > 0`. Quando não há agrupamento ativo, somente o botão "Organizar" aparece.

**Comportamento:**
- Ao clicar, chama `handleRemoveGrouping()` no `category-client.tsx`
- Exibe loading state no botão durante a operação (mesmo padrão de `handleOrganize`)
- Após sucesso, o contexto atualiza a categoria sem `subcategoryOrder`, revertendo a UI automaticamente para listagem plana

**Backend:**

Nova função em `firestore-domain.ts`:
```typescript
async function removeGrouping(categoryId: string): Promise<void>
```
- Faz um único `updateDoc` no documento da categoria com `deleteField()` no campo `subcategoryOrder`
- Não altera nenhum produto — `subcategory` dos produtos é preservado para facilitar re-organização futura

Nova rota: `DELETE /api/category/[categoryId]/grouping`
- Chama `removeGrouping(categoryId)`
- Retorna a categoria atualizada

> **Nota de implementação:** O projeto usa `/api/ai/organize-list` com `categoryId` no body. Se não houver um padrão de dynamic segment `[categoryId]` nas rotas existentes, a rota pode ser simplificada para `POST /api/category/remove-grouping` com `{ categoryId }` no body — seguir o padrão existente.

---

### 2. Seções Colapsáveis

**Escopo:** Todas as seções da página de categoria tornam-se colapsáveis:
- Seção "Fora do carrinho" (`pending`)
- Seção "No carrinho" (`cart`)
- Cada subcategoria (ex: "Frutas e Verduras", "Laticínios")

**Estado inicial:**
- `"cart"` → colapsado por padrão
- `"pending"` → expandido por padrão
- Subcategorias → expandidas por padrão

**Gerenciamento de estado** (`category-client.tsx`):

```typescript
const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
  new Set(["cart"])
);

function toggleSection(id: string) {
  setCollapsedSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}
```

**IDs das seções:**

| Seção | ID |
|---|---|
| Fora do carrinho | `"pending"` |
| No carrinho | `"cart"` |
| Subcategoria | `"sub:<nome>"` (prefixo evita colisão com seções principais) |

**Animação de colapso** — padrão CSS grid sem JS de layout:

```tsx
<div className={cn(
  "grid transition-all duration-200",
  isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
)}>
  <div className="overflow-hidden">
    {/* conteúdo */}
  </div>
</div>
```

**Alterações em componentes:**

- **`SubcategoryHeader`** — recebe `isCollapsed: boolean` e `onToggle: () => void`. Header vira clicável; adiciona `ChevronDown` com `rotate(-90deg)` quando colapsado.

- **Novo `SectionHeader`** (ou variante do `SubcategoryHeader`) — usado para as seções "Fora do carrinho" e "No carrinho". Clicável, com chevron, exibe nome da seção e contagem de produtos.

- **`category-client.tsx`** — passa `isCollapsed` e `onToggle` para `SubcategoryHeader` e `SectionHeader`; envolve o conteúdo de cada seção no wrapper colapsável.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/components/category-hero-card.tsx` | Adiciona botão `ListX` condicional |
| `src/components/subcategory-header.tsx` | Adiciona props `isCollapsed` e `onToggle`, chevron interativo |
| `src/app/category/category-client.tsx` | Estado `collapsedSections`, `toggleSection`, wrappers colapsáveis, `handleRemoveGrouping` |
| `src/lib/firestore-domain.ts` | Nova função `removeGrouping(categoryId)` |
| `src/app/api/category/[categoryId]/grouping/route.ts` | Nova rota `DELETE` |
| `src/components/section-header.tsx` | Novo componente para headers "Fora do carrinho" / "No carrinho" |

---

## Fora de escopo

- Persistência do estado de colapso entre navegações (localStorage/banco)
- Remoção do campo `subcategory` dos produtos ao remover agrupamento
- Reordenação manual de subcategorias
