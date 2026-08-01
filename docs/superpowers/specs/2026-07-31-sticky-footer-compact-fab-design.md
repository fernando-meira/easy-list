# Design: StickyFooter Expandido ↔ Compacto (FAB)

**Data:** 2026-07-31
**Status:** Aprovado

---

## Contexto

O `StickyFooter` ([src/components/sticky-footer.tsx](../../../src/components/sticky-footer.tsx)) é um card fixo na base da página de categoria. Ele exibe o total, o subtotal do carrinho, o botão primário "Adicionar produto" e o botão de scanner de código de barras. O card ocupa ~140px de altura, e `category-client.tsx` reserva esse espaço com `pb-[140px]` no container da lista para o conteúdo não ficar escondido atrás dele.

Em listas longas esse card come uma fatia relevante da viewport em telas pequenas. O objetivo é colapsá-lo em um FAB compacto durante o scroll para baixo, devolvendo espaço vertical para a lista, e reexpandi-lo quando o usuário sinalizar interesse (scroll para cima, toque no FAB, ou chegada ao fim da lista).

**Restrições do projeto:**
- O scroll é da janela (`window`) — a lista **não** tem container de scroll próprio.
- `framer-motion` **não** está instalado. As libs de animação/gesto presentes são `vaul` (drawers) e `@use-gesture/react`. Decidido: **não** adicionar dependência nova; a transição usa CSS (`transform`/`opacity`), consistente com o padrão de colapso já usado nas seções da lista (`grid-rows-[0fr]` + `transition-all`).
- O projeto não possui suíte de testes automatizados. A validação é manual no browser.

---

## Funcionalidades

### 1. Hook `useScrollDirection`

**Novo arquivo:** `src/hooks/useScrollDirection.ts`

```ts
interface UseScrollDirectionOptions {
  threshold?: number;      // default: 15
  bottomOffset?: number;   // default: 0
}

interface UseScrollDirectionResult {
  isNearBottom: boolean;
  isScrollingDown: boolean;
}

export function useScrollDirection(
  options?: UseScrollDirectionOptions
): UseScrollDirectionResult;
```

**Comportamento:**

- Registra **um único** listener `scroll` em `window` com `{ passive: true }`.
- Coalesce os eventos via `requestAnimationFrame` usando uma flag `ticking` em `useRef` — no máximo um cálculo por frame, independente de quantos eventos de scroll o browser disparar.
- Mantém `lastScrollY` em `useRef`. Só chama `setIsScrollingDown` quando `Math.abs(scrollY - lastScrollY) > threshold`, evitando jitter em micro-scrolls e re-renders desnecessários. `lastScrollY` só é atualizado quando o threshold é superado, para que scrolls pequenos e sucessivos na mesma direção acumulem até cruzar o limite em vez de serem descartados um a um.
- `isNearBottom` é calculado como:
  ```ts
  window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - bottomOffset
  ```
  `isNearBottom` é recalculado em todo tick (não é gated pelo `threshold`), porque atingir o fim da página precisa ser detectado mesmo em movimentos pequenos.
- Cleanup no `useEffect`: remove o listener e cancela qualquer `requestAnimationFrame` pendente (o id do frame é guardado em ref para isso), evitando `setState` após o unmount.
- Executa uma medição inicial no mount, para o caso de a página já abrir rolada (restauração de scroll do browser).

**Isolamento:** o hook é chamado **apenas** dentro de `StickyFooter`. A lista de produtos e o resto da árvore não re-renderizam a cada tick de scroll.

---

### 2. Constante `FOOTER_CLEARANCE_PX`

Hoje o valor `140` existe duplicado implicitamente: como `pb-[140px]` em [category-client.tsx:290](../../../src/app/category/category-client.tsx) e como a altura real do card. Ele passa a ser exportado de `sticky-footer.tsx`:

```ts
export const FOOTER_CLEARANCE_PX = 140;
```

- `StickyFooter` usa como `bottomOffset` do hook.
- `category-client.tsx` troca `pb-[140px]` por `style={{ paddingBottom: FOOTER_CLEARANCE_PX }}` no container da lista.

**Motivo do `style` em vez de classe Tailwind:** o JIT do Tailwind não resolve valores arbitrários a partir de constantes JS (`pb-[${X}px]` não gera CSS). Usar `style` garante uma fonte única de verdade compartilhada entre o espaço reservado e a detecção de fim de lista, evitando que os dois dessincronizem.

---

### 3. Máquina de estado do `StickyFooter`

```ts
const { isNearBottom, isScrollingDown } = useScrollDirection({
  bottomOffset: FOOTER_CLEARANCE_PX,
});
const [forceExpanded, setForceExpanded] = useState(false);

useEffect(() => {
  if (isScrollingDown) setForceExpanded(false);
}, [isScrollingDown]);

const isCompact = isScrollingDown && !isNearBottom && !forceExpanded;
```

| Gatilho | Resultado |
|---|---|
| Scroll para baixo (> 15px) | Compacta (FAB) |
| Scroll para cima (> 15px) | Expande (`isScrollingDown` → `false`) |
| Toque no FAB | Expande imediatamente (`forceExpanded = true`) |
| Fim da lista alcançado | Força expandido, mesmo durante scroll down |

O override `forceExpanded` é descartado na próxima **transição** para scroll-down — ou seja, quando `isScrollingDown` passa de `false` para `true`. Consequência aceita: se o usuário tocar no FAB e seguir rolando para baixo sem nunca rolar para cima, o card permanece expandido, porque `isScrollingDown` já era `true` e não houve transição. Isso é intencional: o toque é um sinal explícito de intenção do usuário e não deve ser revogado pelo mesmo gesto que o precedeu.

---

### 4. Markup e animação

Duas camadas irmãs dentro de um wrapper `fixed`, com cross-fade + `scale`/`translate` e `transition-all duration-200 ease-out`.

**Por que cross-fade e não morph geométrico:** o card expandido é centralizado e largo (`max-w-3xl`), o FAB é ancorado no canto inferior direito e estreito. Animar essa mudança de geometria como um único elemento exigiria layout animations (o `layout` do `framer-motion`) — descartado por não justificar a dependência. O cross-fade de duas camadas entrega uma transição fluida sem lib nova.

```tsx
<div className="fixed inset-x-0 bottom-0 z-10 pointer-events-none">
  <div className="relative mx-auto max-w-3xl p-3">
    {/* Camada 1: card expandido — markup atual preservado */}
    <div
      aria-hidden={isCompact}
      className={cn(
        'origin-bottom transition-all duration-200 ease-out motion-reduce:transition-none',
        isCompact
          ? 'pointer-events-none translate-y-2 scale-95 opacity-0'
          : 'pointer-events-auto translate-y-0 scale-100 opacity-100'
      )}
    >
      {/* card com Total, Carrinho, "Adicionar produto" e scanner */}
    </div>

    {/* Camada 2: FAB pill compacto */}
    <button
      type="button"
      tabIndex={isCompact ? 0 : -1}
      aria-hidden={!isCompact}
      aria-label="Expandir resumo do carrinho"
      onClick={() => setForceExpanded(true)}
      className={cn(
        'absolute bottom-3 right-3 origin-bottom-right transition-all duration-200 ease-out motion-reduce:transition-none',
        isCompact
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-2 scale-90 opacity-0'
      )}
    >
      <Plus /> {convertToCurrency(totalProductsValue)}
    </button>
  </div>
</div>
```

**Wrapper:** `pointer-events-none` no wrapper `fixed` + `pointer-events-auto` só na camada ativa. Isso impede que a faixa transparente do wrapper intercepte toques na lista atrás dele.

**FAB (formato escolhido — pill horizontal):** ícone `Plus` + valor total resumido, ancorado no canto inferior direito. Usa os tokens visuais existentes (`--color-primary`, `--color-on-primary`, `--radius-*`) para se manter dentro do design system do projeto.

**Botão de scanner:** existe **apenas** no card expandido. Não é replicado no FAB — o modo compacto é um resumo/atalho de reabertura, não uma barra de ações.

---

### 5. Acessibilidade

- A camada inativa recebe `aria-hidden` **e** `pointer-events-none` **e** (no caso do FAB) `tabIndex={-1}`. Nunca fica clicável nem focável enquanto invisível — evita foco em elemento oculto e cliques fantasma.
- `motion-reduce:transition-none` respeita `prefers-reduced-motion`: a troca acontece instantaneamente, sem animação.
- O FAB tem `aria-label="Expandir resumo do carrinho"`. Apesar do ícone `Plus`, sua ação é **reexpandir**, não adicionar produto — rotulá-lo como "Adicionar produto" enganaria leitores de tela.
- O botão "Adicionar produto" permanece funcional e acessível sempre que o card está expandido, incluindo após reexpansão via FAB.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useScrollDirection.ts` | Novo — hook de direção de scroll + detecção de fim de página |
| `src/components/sticky-footer.tsx` | Refatoração: dois estados visuais, `FOOTER_CLEARANCE_PX`, FAB compacto |
| `src/app/category/category-client.tsx` | `pb-[140px]` → `style={{ paddingBottom: FOOTER_CLEARANCE_PX }}` |

---

## Validação (manual, no browser)

1. Scroll para baixo em uma lista longa → card colapsa em FAB pill no canto inferior direito, com animação suave.
2. Scroll para cima → FAB reexpande no card completo.
3. Toque no FAB em modo compacto → reexpande imediatamente; "Adicionar produto" abre o sheet normalmente em seguida.
4. Rolar até o fim da lista → card fica expandido e não colapsa, mesmo continuando o gesto para baixo.
5. Lista curta (sem scroll disponível) → card permanece expandido.
6. Com `prefers-reduced-motion: reduce` ativo → troca de estado sem animação.
7. Toques na lista atrás da faixa do footer continuam funcionando (`pointer-events`).

---

## Fora de escopo

- Adicionar `framer-motion` ao projeto.
- Aplicar o mesmo padrão ao `Footer` da home (`src/components/footer.tsx`).
- Persistir o estado expandido/compacto entre navegações.
- Ação de scanner acessível no modo compacto.
- Disparar `onAddProduct` direto do FAB (decidido: o toque só reexpande).
- Testes automatizados — o projeto não possui suíte hoje.
