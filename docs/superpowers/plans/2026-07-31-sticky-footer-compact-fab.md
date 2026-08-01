# StickyFooter Expandido ↔ Compacto (FAB) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colapsar o `StickyFooter` da página de categoria em um FAB pill compacto durante o scroll para baixo, reexpandindo no scroll para cima, no toque do FAB, ou ao atingir o fim da lista.

**Architecture:** Um hook `useScrollDirection` isolado monitora o scroll de `window` com listener passivo coalescido por `requestAnimationFrame`, expondo `isScrollingDown` e `isNearBottom`. O `StickyFooter` deriva `isCompact` desses sinais mais um override local `forceExpanded`, e renderiza duas camadas irmãs (card expandido + FAB pill) que fazem cross-fade via classes Tailwind de `transform`/`opacity`. Sem lib de animação nova.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS, `lucide-react`, `cn` de `@/lib/utils`.

**Spec:** [docs/superpowers/specs/2026-07-31-sticky-footer-compact-fab-design.md](../specs/2026-07-31-sticky-footer-compact-fab-design.md)

---

## Contexto para quem não conhece o projeto

- **Não existe suíte de testes.** Não há jest, vitest, testing-library nem qualquer arquivo `*.test.*` / `*.spec.*` no repositório. Não invente uma suíte: a verificação de cada task é `npm run lint` + `npx tsc --noEmit`, e a validação funcional é manual no browser (Task 4).
- **Convenção de ordenação obrigatória** (`.claude/rules/organization.md`): imports, propriedades de objeto, campos de type e parâmetros multiline são ordenados por **menor quantidade de caracteres na linha completa primeiro**; empate resolve em ordem alfabética. Isso vale para todo código escrito neste plano — o código nos steps abaixo já está ordenado corretamente, copie como está.
- **Tokens de design:** cores e raios vêm de CSS custom properties (`var(--color-primary)`, `var(--color-on-primary)`, `var(--radius-md)`, `var(--color-ink)`, `var(--color-muted)`, `var(--color-canvas)`, `var(--color-hairline)`, `var(--color-surface-card)`). Nunca use cores literais (`#18181b`, `bg-zinc-900`) — o hook de design do projeto reclama.
- **O scroll é da janela** (`window`), não de um container. A lista não tem `overflow-y`.
- **Servidor de dev:** use a ferramenta de preview do harness com a config `easy-list-dev` (já existe em `.claude/launch.json`, porta 3000). Nunca rode `npm run dev` via Bash.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/hooks/useScrollDirection.ts` | **Criar.** Única responsabilidade: observar o scroll de `window` e expor direção + proximidade do fim do documento. Nenhum conhecimento de footer, produtos ou UI. |
| `src/components/sticky-footer.tsx` | **Modificar.** Deriva o estado visual do hook, exporta `FOOTER_CLEARANCE_PX`, renderiza as duas camadas (card + FAB). |
| `src/app/category/category-client.tsx` | **Modificar (1 linha + 1 import).** Consome `FOOTER_CLEARANCE_PX` para o espaço reservado na base da lista. |
| `src/components/category-page-skeleton.tsx` | **Modificar (1 linha + 1 import).** Tem o mesmo container `flex flex-col gap-4 pb-[140px]` reservando espaço para o mesmo footer, então consome a mesma constante. |

A fronteira importante: o hook não sabe nada sobre o footer, e o footer não fala com `window` diretamente. Isso mantém o hook reutilizável e o footer testável a olho.

---

## Task 1: Hook `useScrollDirection`

**Files:**
- Create: `src/hooks/useScrollDirection.ts`

- [ ] **Step 1: Criar o arquivo do hook**

Crie `src/hooks/useScrollDirection.ts` com exatamente este conteúdo:

```ts
'use client';

import { useRef, useState, useEffect } from 'react';

interface UseScrollDirectionOptions {
  threshold?: number;
  bottomOffset?: number;
}

interface UseScrollDirectionResult {
  isNearBottom: boolean;
  isScrollingDown: boolean;
}

export function useScrollDirection({
  threshold = 15,
  bottomOffset = 0,
}: UseScrollDirectionOptions = {}): UseScrollDirectionResult {
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    function measure() {
      const scrollY = window.scrollY;
      const reachedBottom =
        scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - bottomOffset;

      setIsNearBottom(reachedBottom);

      const delta = scrollY - lastScrollYRef.current;

      if (Math.abs(delta) > threshold) {
        setIsScrollingDown(delta > 0);
        lastScrollYRef.current = scrollY;
      }
    }

    function handleScroll() {
      if (tickingRef.current) return;

      tickingRef.current = true;

      rafIdRef.current = window.requestAnimationFrame(() => {
        measure();
        tickingRef.current = false;
      });
    }

    lastScrollYRef.current = window.scrollY;
    measure();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      tickingRef.current = false;
    };
  }, [threshold, bottomOffset]);

  return { isNearBottom, isScrollingDown };
}
```

**Notas sobre decisões que parecem arbitrárias mas não são:**
- `isNearBottom` inicia em `true` e `isScrollingDown` em `false` porque o estado inicial correto é **expandido**. Um valor inicial errado causaria um flash do FAB no primeiro paint.
- `measure()` roda uma vez no mount porque o browser pode restaurar a posição de scroll ao voltar para a página — sem isso, o footer abriria expandido no meio da lista quando deveria já estar compacto.
- `lastScrollYRef` só é atualizado **dentro** do `if` do threshold. Isso é intencional: scrolls pequenos e sucessivos na mesma direção acumulam até cruzar o limite, em vez de serem descartados um a um.
- `setIsNearBottom` é chamado em todo tick (fora do `if` do threshold) porque atingir o fim da página precisa ser detectado mesmo em movimentos pequenos.
- `tickingRef.current = false` no cleanup evita que um `rAF` já agendado deixe a flag travada em `true` caso o componente remonte.
- O cleanup também chama `cancelAnimationFrame` no id guardado em `rafIdRef`: sem isso, um frame agendado imediatamente antes do unmount ainda executaria `measure()` e chamaria `setState` num componente desmontado.

**Ordenação das declarações:** `.claude/rules/organization.md` ordena pela contagem de caracteres da **linha completa** (não do nome da variável), com empate resolvido alfabeticamente. Aqui: `const lastScrollYRef = useRef(0);` (33) e `const tickingRef = useRef(false);` (33) empatam → alfabética; `const rafIdRef = useRef<number | null>(null);` (45) vai por último. Para imports essa regra é **machine-enforced** por `eslint-plugin-perfectionist` (`sort-imports` e `sort-named-imports` com `type: line-length, order: asc`) — em caso de dúvida, rode `npx eslint --fix <arquivo>` e deixe o plugin posicionar.

- [ ] **Step 2: Verificar tipos e lint**

Rode:

```bash
npx tsc --noEmit
```

Esperado: nenhum erro. Depois:

```bash
npm run lint
```

Esperado: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useScrollDirection.ts
git commit -m "feat(hooks): adiciona useScrollDirection com deteccao de direcao e fim de pagina"
```

---

## Task 2: Refatorar `StickyFooter` com estado compacto

**Files:**
- Modify: `src/components/sticky-footer.tsx` (substituição integral do arquivo)

- [ ] **Step 1: Substituir o conteúdo de `src/components/sticky-footer.tsx`**

Substitua **todo** o arquivo por este conteúdo:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, ScanLine } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ProductProps } from '@/types/interfaces';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { convertToCurrency, calculateTotalValue } from '@/utils';

export const FOOTER_CLEARANCE_PX = 140;

interface StickyFooterProps {
  products: ProductProps[];
  onAddProduct: () => void;
  onScanProduct: () => void;
}

export function StickyFooter({ products, onAddProduct, onScanProduct }: StickyFooterProps) {
  const { isNearBottom, isScrollingDown } = useScrollDirection({
    bottomOffset: FOOTER_CLEARANCE_PX,
  });

  const [forceExpanded, setForceExpanded] = useState(false);

  const { totalProductsValue, filteredProductsValue } =
    calculateTotalValue(products);

  useEffect(() => {
    if (isScrollingDown) setForceExpanded(false);
  }, [isScrollingDown]);

  const isCompact = isScrollingDown && !isNearBottom && !forceExpanded;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 pointer-events-none">
      <div className="relative mx-auto max-w-3xl p-3">
        <div
          aria-hidden={isCompact}
          className={cn(
            'flex flex-col gap-3 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-3 origin-bottom transition-all duration-200 ease-out motion-reduce:transition-none',
            isCompact
              ? 'pointer-events-none translate-y-2 scale-95 opacity-0'
              : 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          )}
        >
          {/* Totals row */}
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-[var(--color-muted)]">
                Total
              </span>
              <span className="text-[12px] font-medium text-[var(--color-muted)]">
                Carrinho: {convertToCurrency(filteredProductsValue)}
              </span>
            </div>
            <span className="text-[22px] font-semibold text-[var(--color-ink)]">
              {convertToCurrency(totalProductsValue)}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_48px] gap-2">
            <button
              type="button"
              tabIndex={isCompact ? -1 : 0}
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

            <button
              type="button"
              aria-label="Escanear produto"
              tabIndex={isCompact ? -1 : 0}
              onClick={(e) => {
                (e.currentTarget as HTMLButtonElement).blur();
                onScanProduct();
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-card)]"
            >
              <ScanLine className="h-[15px] w-[15px] text-[var(--color-ink)]" />
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-hidden={!isCompact}
          tabIndex={isCompact ? 0 : -1}
          onClick={() => setForceExpanded(true)}
          aria-label="Expandir resumo do carrinho"
          className={cn(
            'absolute bottom-3 right-3 flex h-12 items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 shadow-lg origin-bottom-right transition-all duration-200 ease-out motion-reduce:transition-none',
            isCompact
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-2 scale-90 opacity-0'
          )}
        >
          <Plus className="h-[18px] w-[18px] text-[var(--color-on-primary)]" />
          <span className="text-[14px] font-semibold text-[var(--color-on-primary)]">
            {convertToCurrency(totalProductsValue)}
          </span>
        </button>
      </div>
    </div>
  );
}
```

**O que mudou em relação ao arquivo original e por quê:**
- O wrapper externo virou `fixed inset-x-0 bottom-0 pointer-events-none`, e o wrapper interno ganhou `relative` para ancorar o FAB via `absolute`. `pointer-events-none` no wrapper é essencial: sem isso a faixa transparente do footer intercepta toques na lista atrás dele.
- O card expandido manteve exatamente o mesmo markup interno (totais, botão primário, scanner) — só ganhou as classes de transição e `pointer-events`/`tabIndex` condicionais.
- Os dois botões do card recebem `tabIndex={isCompact ? -1 : 0}` porque `aria-hidden` no container **não** remove os filhos da ordem de tabulação. Sem isso, um usuário de teclado focaria botões invisíveis no modo compacto.
- O FAB usa `aria-label="Expandir resumo do carrinho"`, não "Adicionar produto": o toque nele apenas reexpande o card (decisão registrada na spec). Rotular como "Adicionar produto" enganaria leitor de tela.
- `motion-reduce:transition-none` em ambas as camadas respeita `prefers-reduced-motion`.

- [ ] **Step 2: Verificar tipos e lint**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro.

```bash
npm run lint
```

Esperado: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Commit**

```bash
git add src/components/sticky-footer.tsx
git commit -m "feat(sticky-footer): adiciona estado compacto em FAB com transicao animada"
```

---

## Task 3: Ligar `FOOTER_CLEARANCE_PX` no `category-client`

**Files:**
- Modify: `src/app/category/category-client.tsx` (import + linha ~290)

- [ ] **Step 1: Atualizar o import do `StickyFooter`**

Localize esta linha em `src/app/category/category-client.tsx`:

```tsx
import { StickyFooter } from '@/components/sticky-footer';
```

Substitua por:

```tsx
import { StickyFooter, FOOTER_CLEARANCE_PX } from '@/components/sticky-footer';
```

A linha cresce mas permanece na posição correta da escada de imports do arquivo (ela já é uma das mais longas do bloco; confira que as linhas seguintes — `section-header`, `category-select`, `category-hero-card` — continuam iguais ou maiores em número de caracteres e reordene o bloco de imports se necessário, seguindo `.claude/rules/organization.md`).

- [ ] **Step 2: Trocar o padding fixo pelo valor da constante**

Localize esta linha (aproximadamente linha 290, dentro do `return` do componente):

```tsx
      <div className="flex flex-col gap-4 pb-[140px]">
```

Substitua por:

```tsx
      <div className="flex flex-col gap-4" style={{ paddingBottom: FOOTER_CLEARANCE_PX }}>
```

**Por que `style` e não uma classe Tailwind:** o JIT do Tailwind não resolve valores arbitrários a partir de constantes JS — `pb-[${FOOTER_CLEARANCE_PX}px]` não gera CSS nenhum e o padding simplesmente desapareceria. O `style` inline garante uma fonte única de verdade compartilhada entre o espaço reservado da lista e o `bottomOffset` da detecção de fim de página.

- [ ] **Step 3: Verificar tipos e lint**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro.

```bash
npm run lint
```

Esperado: `✔ No ESLint warnings or errors`

- [ ] **Step 4: Confirmar que não sobrou nenhum `140px` órfão**

```bash
git grep -n "140px" -- src/
```

Esperado: nenhuma saída. Se aparecer alguma ocorrência, ela é um resquício do valor mágico antigo e deve passar a usar `FOOTER_CLEARANCE_PX`.

Sabe-se que `src/components/category-page-skeleton.tsx` tem uma ocorrência: o skeleton da mesma página usa o container idêntico (`flex flex-col gap-4 pb-[140px]`) reservando espaço para o mesmo footer. Aplique nele a mesma troca (import + `style={{ paddingBottom: FOOTER_CLEARANCE_PX }}`).

- [ ] **Step 5: Commit**

```bash
git add src/app/category/category-client.tsx
git commit -m "refactor(category): usa FOOTER_CLEARANCE_PX no espaco reservado da lista"
```

---

## Task 4: Validação manual no browser

Não há testes automatizados no projeto, então esta task é a verificação real de que a feature funciona. **Não marque a implementação como concluída sem executá-la.**

**Files:** nenhum (validação)

- [ ] **Step 1: Subir o servidor de dev**

Use a ferramenta de preview do harness com a config `easy-list-dev` (definida em `.claude/launch.json`, porta 3000). **Não** rode `npm run dev` via Bash.

- [ ] **Step 2: Abrir uma categoria com lista longa**

Navegue até a home, entre em uma categoria que tenha produtos suficientes para gerar scroll. Se nenhuma categoria tiver produtos suficientes, redimensione a viewport para `mobile` (375x812) — isso torna qualquer lista com ~8 itens rolável.

- [ ] **Step 3: Checar erros de console e rede**

Leia as mensagens de console e os logs do servidor. Esperado: nenhum erro novo. Um erro comum a procurar: `Cannot read properties of undefined` vindo do hook caso `document.documentElement` seja acessado durante SSR — o hook só toca em `window`/`document` dentro do `useEffect`, então isso não deve acontecer.

- [ ] **Step 4: Percorrer os 7 cenários da spec**

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Scroll para baixo na lista | Card colapsa em FAB pill no canto inferior direito, com animação suave |
| 2 | Scroll para cima | FAB reexpande no card completo |
| 3 | Tocar no FAB em modo compacto | Reexpande imediatamente; "Adicionar produto" abre o sheet normalmente em seguida |
| 4 | Rolar até o fim da lista | Card fica expandido e não colapsa, mesmo continuando o gesto para baixo |
| 5 | Lista curta (sem scroll disponível) | Card permanece expandido |
| 6 | `prefers-reduced-motion: reduce` ativo | Troca de estado sem animação |
| 7 | Tocar em um produto atrás da faixa do footer | O toque atinge o produto (`pointer-events` do wrapper não bloqueia) |

Para o cenário 6, force a preferência no browser via:

```js
matchMedia('(prefers-reduced-motion: reduce)').matches
```

Se retornar `false`, use as devtools do browser para emular `prefers-reduced-motion: reduce` (Rendering → Emulate CSS media feature) e repita o cenário 1.

Para o cenário 7, verifique que o último produto da lista continua clicável — é ele que fica sob a área do footer.

- [ ] **Step 5: Capturar evidência**

Tire um screenshot do estado compacto (FAB visível) e um do estado expandido. Compartilhe ambos.

- [ ] **Step 6: Se algum cenário falhar**

Não ajuste os números às cegas. Diagnostique primeiro:
- **FAB pisca no primeiro paint:** valores iniciais de `useState` no hook estão invertidos.
- **Nunca colapsa:** `isNearBottom` está sempre `true` — provavelmente `bottomOffset` grande demais em relação à altura da página, ou a página não tem scroll suficiente. Confirme com `document.documentElement.scrollHeight > window.innerHeight`.
- **Colapsa mas não reexpande no fim da lista:** `bottomOffset` menor que a altura real do card. Meça a altura renderizada do card e ajuste `FOOTER_CLEARANCE_PX` (ele controla os dois lados, então continua consistente).
- **Toques na lista não funcionam:** falta `pointer-events-none` no wrapper `fixed` ou `pointer-events-auto` na camada ativa.

---

## Fora de escopo (não faça)

- Adicionar `framer-motion` ou qualquer lib de animação.
- Aplicar o mesmo padrão ao `Footer` da home (`src/components/footer.tsx`).
- Persistir o estado expandido/compacto entre navegações.
- Tornar o scanner acessível no modo compacto.
- Disparar `onAddProduct` direto do FAB.
- Criar uma suíte de testes para este projeto.
