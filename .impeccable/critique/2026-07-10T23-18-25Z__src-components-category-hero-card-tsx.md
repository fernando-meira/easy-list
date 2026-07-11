---
target: componente category-hero-card.tsx
total_score: 27
p0_count: 1
p1_count: 2
timestamp: 2026-07-10T23-18-25Z
slug: src-components-category-hero-card-tsx
---
# Critique — `category-hero-card.tsx`

Method: dual-agent (A: a374872635bb3a19e · B: a581ab95dc228c8e9)

## Design Health Score

| # | Heurística | Nota | Questão-chave |
|---|-----------|------|---------------|
| 1 | Visibilidade do estado | 3 | Estado visível (contagens, spinners), mas triplicado e sem hierarquia — excesso, não falta. |
| 2 | Correspondência com o mundo real | 3 | "no carrinho" vs "comprados" para o mesmo dado confunde o modelo mental. |
| 3 | Controle e liberdade | 3 | Collapse dá controle; "Organizar" reordena tudo sem undo visível. |
| 4 | Consistência e padrões | 2 | Toggle 32px (<34px do DESIGN); `surface-soft` 3× apesar de "uso raro"; CategorySelect lê como card aninhado. |
| 5 | Prevenção de erro | 3 | `disabled` correto em Organizar (<2 produtos); share só trata via toast. |
| 6 | Reconhecer > lembrar | 3 | Ícones+rótulos ok; Sparkles não comunica que é IA/reordenação. |
| 7 | Flexibilidade/eficiência | 3 | Collapse útil; sem aceleradores extras. |
| 8 | Estético e minimalista | 2 | Informação triplicada + stat-pill row contradizem "simples e calmo". |
| 9 | Recuperação de erro | 3 | Toasts claros em PT. |
| 10 | Ajuda/documentação | 3 | `aria-label` no toggle bom; sem tooltip onde "Organizar"/"Remover agrupamento" precisariam. |
| **Total** | | **27/40** | **Acceptable — foco/minimalismo precisam de trabalho** |

## Anti-Patterns Verdict

**LLM assessment:** Não grita "IA fez isso", mas tem um tell estrutural: a fileira de dois `StatPill` (`flex-1`, número+rótulo) é o **hero-metric template** — vocabulário de dashboard num app cujo anti-reference nº1 é "dashboard corporativo". Agravado pela **redundância tripla**: `totalCount` (header) + `cartCount` ("no carrinho") + StatPills (`pendentes`/`comprados`), com `cartCount` mostrado duas vezes ("no carrinho" == "comprados"). `CategorySelect` (h-16, borda, surface-card) lê como card aninhado, banido pelo DESIGN.

**Deterministic scan:** detector limpo nos dois arquivos (`category-hero-card.tsx` exit 0 `[]`; `category-client.tsx` exit 0 `[]`). Zero falsos positivos. O detector não pega redundância informacional nem hierarquia — o achado P0 é invisível pra ele; concordância só no que é regra sintática.

**Contraste (cálculo exato, B):**
- muted #6b7280 / surface-soft #f8f9fa (StatPill, pílula carrinho, 13px): **4.59:1** — passa AA por margem mínima (0.09 acima de 4.5).
- muted #6b7280 / canvas #fff ("N produtos nesta lista"): 4.83:1 — passa.
- ink #111 / surface-soft: 17.91:1 — passa.
- **success #10b981 / surface-soft (ícone ShoppingCart): 2.41:1 — FALHA o 3:1.** Mitigado: o ícone é redundante (texto "{cartCount} no carrinho" ao lado), não é o único portador de significado.

**Visual overlays:** indisponível. Browser bloqueado por auth — `/category` redireciona 307 → `/login`. Nenhuma evidência renderizada do card; sem overlay.

## Overall Impression
O componente é tecnicamente disciplinado (tokens, plano-por-padrão, foco do toggle exemplar), mas está **sobrecarregado de informação redundante** e mistura quatro intenções (identidade + status + ações + navegação) numa superfície só. A maior oportunidade: cortar a contagem de três representações para uma e tirar a troca de lista de dentro do card.

## What's Working
1. **Foco do toggle exemplar:** `aria-label` dinâmico, ícones `aria-hidden`, anel de foco completo (`ring-2 ring-ink ring-offset-2 ring-offset-canvas`). Melhor detalhe do arquivo.
2. **Disciplina de tokens + plano-por-padrão:** `border-hairline` + `bg-canvas` + `shadow-none` explícito nos botões; não vaza sombra shadcn pra tela de produto.
3. **Loading states corretos:** `LoadingSpinner` inline substituindo o ícone com `disabled` durante organize/remove.

## Priority Issues

**[P0] Redundância informacional tripla (mesmo dado 3×)**
- Why: header total + pílula "N no carrinho" + StatPills "pendentes/comprados"; `cartCount` aparece 2× com nomes diferentes. Viola "simples, calma e confiável" e o princípio "priorizar a lista, não o chrome". É o tell hero-metric que faz o card parecer dashboard.
- Fix: escolher UMA representação. Ex.: uma frase "N pendentes · N no carrinho" e eliminar os StatPills OU a pílula + sublinha de total (derivável). Unificar vocabulário: "no carrinho" OU "comprados", nunca ambos.
- Comando: `/impeccable distill`

**[P1] CategorySelect lê como card aninhado e está fora de tema**
- Why: `SelectTrigger` h-16, borda hairline, bg surface-card — box preenchido dentro do card-herói (banimento de cards aninhados). Trocar de lista é navegação, não pertence ao cartão da lista atual.
- Fix: mover o seletor pra fora do card (junto ao header/breadcrumb da página) ou reduzir a controle ghost sem moldura.
- Comando: `/impeccable layout`

**[P1] Alvo de toque abaixo do guia**
- Why: toggle recolher é `h-8 w-8` = 32px, abaixo dos 44px de a11y e dos 34px do próprio DESIGN. É o menor alvo do card, no canto superior direito, longe do polegar (persona Casey).
- Fix: subir a área tocável do toggle pra ≥40px (idealmente 44px via padding), no mínimo alinhar aos 34px do sistema.
- Comando: `/impeccable harden`

**[P2] Contraste: ícone de sucesso falha 3:1 + muted marginal**
- Why: ShoppingCart verde em surface-soft = 2.41:1 (falha, mas redundante com o texto). muted em surface-soft = 4.59:1, aprovação frágil sem margem. `surface-soft` usado 3× apesar de "uso raro" no DESIGN.
- Fix: escurecer o rótulo muted ou trocar o fundo da pílula pra canvas (sobe pra 4.83:1); reduzir uso de surface-soft. Ícone: não é bloqueante por ser redundante, mas escurecer o verde ajuda.
- Comando: `/impeccable audit`

**[P2] "Organizar lista" / "Remover agrupamento" não se explicam e não têm undo**
- Why: rótulos não comunicam o efeito; Sparkles sugere IA mas não diz que reordena a lista inteira; "agrupamento" pressupõe conhecimento. Ação de IA que muda tudo sem preview/undo é ansiogênica (persona Jordan), oposto de "calma e confiável".
- Fix: rótulo mais concreto ("Organizar por seção com IA"), microcopy/tooltip do efeito, e undo via toast após organizar.
- Comando: `/impeccable clarify`

## Persona Red Flags

**Casey (mobile distraído / thumb zone):** toggle 32px no canto superior-direito — menor alvo, pior posição pro polegar. Densidade do card exige leitura atenta que Casey não tem no corredor do mercado.

**Sam (a11y):** StatPill em 4.59:1 (aprovação frágil); ícone sucesso falha 3:1 (mitigado por redundância). Foco do toggle é excelente, mas os `Button` outline herdam `ring-1 ring-ring` — anel mais fraco, inconsistência de indicador de foco. `category.name` no h1 sem `truncate` pode quebrar.

**Jordan (primeira vez):** "Remover agrupamento" e "Organizar lista"/Sparkles não ensinam o efeito; a triplicação de contagens confunde ("dois números iguais com nomes diferentes?").

## Minor Observations
- `<h1>` do card: nesta rota de detalhe não há outro h1 (breadcrumb é `<nav>`), então é o heading principal correto. Só confirmar que não há h1 no header/layout compartilhado.
- Motion: `collapsible.tsx` é Radix cru, sem animação — expansão instantânea (não os 0.2s de accordion das seções abaixo). Sem violação de reduced-motion, mas há salto de layout abrupto ao recolher, inconsistente com as seções animadas na mesma tela.
- `category.name` sem `truncate`/`break-words` — risco de overflow com nomes longos.
- `onOrganize`/`onRemoveGrouping` (`Promise<void>`) passados direto em `onClick` — rejeições sem catch (unhandled rejection). Fora do escopo visual, mas afeta confiabilidade percebida.

## Questions to Consider
1. Se `totalCount = pendentes + comprados` e "no carrinho == comprados", por que ler o mesmo número três vezes antes de ver os produtos?
2. O `CategorySelect` é sobre *esta* lista ou sobre *trocar* de lista? Se é troca, por que vive dentro do cartão-herói?
3. Uma fileira de dois stat-pills não é exatamente o "dashboard corporativo" que o PRODUCT.md proíbe?
4. "Organizar lista" reordena tudo com IA — cadê o preview e o undo que fariam isso parecer confiável?
5. Por que o card começa `open`, mostrando tudo, se o Collapsible existe pra reduzir a densidade inicial?
