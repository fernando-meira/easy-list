# Investigação: modal de produto com teclado virtual mobile

**Data:** 2026-06-08  
**Branch:** `docs/product-modal-keyboard-investigation`  
**Escopo:** análise técnica e plano de solução para problemas de layout no modal de criação/edição de produtos quando o teclado virtual abre em dispositivos móveis  
**Não escopo:** implementar correções de código nesta etapa

---

## Resumo executivo

O problema recorrente não está apenas em falta de `max-height`, `dvh`, `min-h-0` ou `flex-1`. Essas mudanças melhoram alguns cenários, mas não controlam a causa principal: o modal de produto é um bottom drawer do Vaul (`vaul@1.1.2`) que tenta reposicionar inputs automaticamente quando o teclado virtual altera a área visível.

O Vaul faz isso manipulando inline `style.height` e `style.bottom` do `Drawer.Content` com base em `window.visualViewport`. Esse mecanismo depende da ordem de eventos de foco, blur, resize do viewport, fechamento do teclado, scroll lock e comportamento específico de cada navegador. Issues públicas do Vaul mostram bugs abertos ou não planejados exatamente nessa área em iOS Safari, Chrome iOS, Android Chrome e PWAs.

A recomendação é substituir o Vaul no modal de produto por um componente próprio de `ResponsiveProductDialog` baseado em Radix Dialog, preservando a aparência de bottom sheet no mobile e criando uma estratégia explícita de layout com Visual Viewport API. O objetivo é remover a camada de reposicionamento automático do Vaul e controlar diretamente a altura disponível, scroll interno, footer de ações e safe areas.

---

## Funcionamento atual

### Arquivos relevantes

| Arquivo | Papel |
| --- | --- |
| `src/components/product-manager-sheet.tsx` | Implementa criação e edição de produto com `DrawerPrimitive` do Vaul. |
| `src/app/category/category-client.tsx` | Abre o modal de adicionar e o modal de editar produto. |
| `src/components/new-product-form.tsx` | Wrapper legado que também renderiza `ProductManagerSheet`. |
| `src/app/globals.css` | Contém regras globais para `[data-vaul-drawer]`. |
| `src/components/ui/sheet.tsx` | Sheet shadcn/Radix existente, mas não usado pelo modal de produto atual. |

### Estrutura do modal atual

`ProductManagerSheet` usa Vaul diretamente:

```tsx
<DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
  <DrawerPrimitive.Portal>
    <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
    <DrawerPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col ... max-h-[90dvh]">
      <div className="flex flex-shrink-0 justify-center pt-2.5" />
      <div className="min-h-0 flex-1 flex flex-col gap-4 overflow-y-auto ...">
        <form className="flex flex-col gap-4">...</form>
      </div>
    </DrawerPrimitive.Content>
  </DrawerPrimitive.Portal>
</DrawerPrimitive.Root>
```

O conteúdo inteiro do formulário, incluindo botões de ação, fica dentro de uma única região scrollável. Não há footer fixo/sticky separado. Quando o teclado abre, o Vaul também pode alterar inline a altura e o `bottom` do drawer.

### Tentativas anteriores

PR #71 (`6f280c7`) fez mudanças CSS:

- `max-h-[90dvh]` no `DrawerPrimitive.Content`.
- `min-h-0` na área scrollável.
- fallback global `max-height: 90vh` e `max-height: 90dvh` em `[data-vaul-drawer]`.

PR #72 (`f65c089`) fez ajuste de flex:

- adicionou `flex-1` à área scrollável interna para preencher a altura definida pelo drawer.

Essas PRs tratam o tamanho do container e a ocupação do scroll interno. Elas não alteram o algoritmo do Vaul que reposiciona o drawer quando inputs recebem foco.

---

## Diagnóstico encontrado

### Causa raiz

A causa raiz é a combinação de três fatores:

1. O formulário está dentro de um bottom drawer baseado em Vaul, que manipula `height` e `bottom` inline quando detecta teclado virtual.
2. O teclado virtual não tem comportamento uniforme entre iOS Safari, Chrome iOS, Android Chrome, PWAs e diferentes tipos de teclado (`text`, `number`, sugestões, autofill, barra de acessórios).
3. O modal atual depende de uma única região scrollável e não possui footer de ações independente da área de conteúdo, então qualquer erro de altura/scroll afeta diretamente a acessibilidade dos botões.

O resultado é que correções CSS locais competem com estilos inline e heurísticas internas do Vaul. Em alguns dispositivos, `dvh` melhora a altura; em outros, o Vaul ainda desloca o drawer, não restaura o tamanho, cria gap entre drawer e teclado, ou deixa o scroll em estado inconsistente.

### Evidência no código do Vaul 1.1.2

A documentação atual do Vaul lista props relacionadas ao problema:

- `repositionInputs`, padrão `true`.
- `fixed`.
- `noBodyStyles`.
- `preventScrollRestoration`.
- `scrollLockTimeout`.
- `modal`.

No código-fonte publicado do Vaul `v1.1.2`, `Root` instala um listener em `window.visualViewport.resize`. Quando há input focado ou o estado interno `keyboardIsOpen` está ativo, o Vaul calcula a diferença entre `window.innerHeight` e `visualViewport.height`, depois altera o drawer:

```ts
drawerRef.current.style.height = ...;
drawerRef.current.style.bottom = `${Math.max(diffFromInitial, 0)}px`;
```

Também há lógica específica para iOS, herdada de `react-aria`, que intercepta `touchmove`, `touchend`, `focus`, chama `scrollIntoView` manualmente e usa transforms temporários para tentar impedir o Safari de rolar a página ao focar inputs.

Isso confirma que o comportamento final não é determinado apenas pelas classes Tailwind do app. O Vaul mantém estado próprio (`keyboardIsOpen`, `initialDrawerHeight`, `previousDiffFromInitial`) e aplica estilos imperativos durante o ciclo de abertura/fechamento do teclado.

### Evidência em issues públicas do Vaul

Busca pública no repositório `emilkowalski/vaul` por teclado/input/Visual Viewport encontrou relatos diretamente relacionados:

| Issue/PR | Estado observado | Relevância |
| --- | --- | --- |
| `#650` | "Mobile keyboard dismiss: panel height not reset when blur fires before visualViewport resize" em Vaul 1.1.2, iOS Safari e Chrome Android. Fechada como `not_planned`. | Descreve corrida entre blur, `onPointerDownOutside` e `visualViewport.resize`, deixando `height` sem reset. |
| `#521` | "Positioning issues with Inputs when the keyboard changes of type". Aberta. | Relaciona troca de teclado/tipo de input a reposicionamento incorreto. |
| `#619` | "The drawer goes outside the screen on IOS when input is clicked". Aberta. | Sintoma equivalente: drawer sobe demais e input pode sair da área visível. |
| `#514` | "Drawer doesn't reposition after blurring text input". Aberta. | Relaciona blur no input a drawer que não volta corretamente. |
| `#503` | "Drawer does not reposition to bottom of the screen when using input in IOS". Aberta. | Relata comportamento pior com teclado numérico/phone input. |
| `#615` | "page height changed after the keyboard is evoked on iOS (bottom whitespace)". Aberta. | Sintoma equivalente ao espaço branco inferior. |
| `#538` / `#539` | Altura não restaurada no Android; PR propõe remover resize de altura no Android. PR aberta/não mergeada. | Confirma que Android também sofre com reset de `height`/`bottom`. |
| `#510` | Comportamento inconsistente em Chrome para iOS com inputs. Aberta. | Mostra variação entre browsers iOS mesmo usando WebKit. |

Essas evidências indicam que o problema não é isolado ao app. O caso de uso "bottom drawer com formulário e teclado virtual" é uma área instável do Vaul.

### Evidência nas imagens fornecidas

As imagens mostram o drawer deslocado para cima, com grande área vazia escura entre conteúdo e teclado/acessórios do iOS. Em uma delas o campo de produto fica parcialmente no topo da tela, enquanto categoria e detalhes permanecem acima de um grande gap. Esse padrão é compatível com `bottom` aplicado pelo Vaul para compensar o teclado, somado a uma altura do drawer/conteúdo que não corresponde à área visível real.

---

## Avaliação do componente atual

O Vaul é adequado para drawers de navegação, menus, ações rápidas e conteúdo com pouca entrada de texto. Ele é menos adequado para um formulário mobile crítico com múltiplos inputs, teclado numérico, teclado textual, sugestões/autofill e botões de ação que precisam estar sempre acessíveis.

O problema principal não é falta de acessibilidade do Vaul. Vaul usa Radix Dialog por baixo e fornece uma boa API de drawer. O problema é que ele tenta resolver automaticamente um dos pontos mais inconsistentes do mobile web: virtual keyboard + fixed bottom sheet + scroll lock.

Para este caso específico, manter Vaul significa aceitar heurísticas internas que o app não controla. Ajustes como `fixed`, `repositionInputs={false}` ou mais CSS podem reduzir sintomas, mas não eliminam o risco estrutural.

---

## Alternativas avaliadas

### Alternativa A: manter Vaul e ajustar props/CSS

Possíveis mudanças futuras:

- testar `fixed` no `DrawerPrimitive.Root`.
- testar `repositionInputs={false}`.
- remover CSS global que força `transform: translate3d(0, 0, 0) !important` em `[data-vaul-drawer][data-vaul-drawer-visible='true']`.
- criar workaround local em `visualViewport.resize` para limpar `height` e `bottom` quando o teclado fecha.
- mover botões para footer sticky dentro do scroll atual.

Vantagens:

- menor diff inicial.
- preserva swipe-to-close do Vaul.
- não exige trocar a base do componente.

Desvantagens:

- continua dependente do algoritmo interno do Vaul.
- workarounds locais competem com estilos inline aplicados pela biblioteca.
- maior chance de regressão entre iOS, Android e tipos de teclado.
- issues abertas indicam que esse caminho já é problemático na própria biblioteca.

Conclusão: aceitável como mitigação rápida, mas não como correção definitiva.

### Alternativa B: trocar para o `Sheet` shadcn/Radix existente

Possíveis mudanças futuras:

- reimplementar `ProductManagerSheet` usando `src/components/ui/sheet.tsx`.
- usar `side="bottom"` no mobile e talvez `side="right"`/dialog centralizado no desktop.
- aplicar CSS com altura calculada via variável própria.

Vantagens:

- remove o reposicionamento automático do Vaul.
- Radix Dialog fornece portal, overlay, focus trap, title/description, escape e outside interactions.
- componente já existe no projeto.

Desvantagens:

- o `Sheet` atual é genérico e não resolve sozinho virtual keyboard.
- a variante atual usa classes padrão de sheet, não uma arquitetura específica para formulário com footer acessível.
- pode exigir customização significativa do wrapper.

Conclusão: melhor que Vaul para estabilidade, mas ainda precisa de um componente especializado para este formulário.

### Alternativa C: criar `ResponsiveProductDialog` baseado em Radix Dialog com layout próprio

Estrutura proposta:

- Radix Dialog para acessibilidade e controle de modal.
- Mobile: bottom sheet visual com `position: fixed`, `inset-x-0`, `bottom: 0`, `max-height` controlado por CSS variable `--product-dialog-available-height`.
- Desktop/tablet: modal central ou sheet com largura máxima, preservando a experiência atual ou melhorando-a.
- Hook local `useVisualViewportSize` para atualizar CSS variables apenas quando o modal estiver aberto.
- Região de conteúdo scrollável separada do footer.
- Footer sticky/fixo dentro do modal com botões sempre alcançáveis.
- Sem manipular `bottom` para "subir" o drawer; a estratégia deve ser encolher a altura disponível e permitir scroll interno.

Vantagens:

- remove dependência das heurísticas do Vaul.
- mantém acessibilidade via Radix Dialog.
- permite controlar explicitamente iOS safe area, Visual Viewport e fallback sem concorrer com inline styles de biblioteca.
- favorece UX de formulário: conteúdo rola, ações continuam disponíveis.
- mais fácil de testar e depurar porque o algoritmo fica no app.

Desvantagens:

- esforço maior que ajustes CSS.
- perde swipe-to-close nativo do Vaul, a menos que seja reimplementado ou substituído por animações/click/escape/botão fechar.
- exige teste manual em dispositivos reais.

Conclusão: recomendada como solução robusta.

---

## Solução recomendada

Substituir o uso de Vaul no modal de criação/edição de produtos por um componente próprio baseado em Radix Dialog.

### Diretrizes de implementação

1. Criar um componente de infraestrutura, por exemplo `src/components/product-dialog.tsx` ou `src/components/responsive-product-dialog.tsx`.
2. Manter `ProductManagerSheet` como componente de domínio, mas trocar sua composição interna para usar o novo dialog.
3. Separar layout em três áreas:
   - Header fixo: handle visual, título, descrição e botão fechar.
   - Body scrollável: campos do formulário e conteúdo variável.
   - Footer fixo/sticky: ações principais e mensagem auxiliar.
4. Medir viewport disponível com `window.visualViewport` quando suportado.
5. Expor CSS variables no container do modal:
   - `--product-dialog-available-height`.
   - `--product-dialog-visual-offset-top`, se necessário.
   - `--product-dialog-keyboard-height`, apenas para diagnóstico/ajustes.
6. Usar fallback CSS com `100dvh`, `100svh` e `100vh` para navegadores sem Visual Viewport confiável.
7. Evitar alterar `style.bottom` em resposta ao teclado. Preferir reduzir `max-height`/`height` e deixar o conteúdo rolar internamente.
8. Adicionar padding de safe area no footer: `padding-bottom: max(env(safe-area-inset-bottom), 16px)`.
9. Garantir que inputs usem `font-size >= 16px` para evitar zoom automático no iOS.
10. Definir `inputMode` apropriado para campos numéricos/currency quando aplicável, reduzindo mudanças inesperadas de teclado.

### Modelo de layout sugerido

```tsx
<Dialog.Root open={open} onOpenChange={onOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
    <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[var(--product-dialog-available-height)] flex-col rounded-t-2xl bg-background">
      <header className="shrink-0">...</header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">...</div>
      <footer className="shrink-0 border-t bg-background pb-[max(env(safe-area-inset-bottom),16px)]">...</footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Critério importante

O novo componente não deve tentar "acompanhar" o teclado alterando `bottom`. A UI deve permanecer ancorada ao viewport visual e reduzir a altura interna disponível. Quando o navegador sobrepuser o teclado em vez de redimensionar a viewport, o hook deve atualizar a altura disponível com base em `visualViewport.height`.

---

## Plano de implementação

### Fase 1: preparar infraestrutura

Arquivos previstos:

- Criar `src/hooks/useVisualViewportSize.ts` ou implementar hook local no novo componente se não houver reuso imediato.
- Criar `src/components/responsive-product-dialog.tsx`.
- Não alterar APIs de domínio ainda.

Tarefas:

1. Implementar leitura segura de `window.visualViewport.height`, `offsetTop` e `window.innerHeight` somente no cliente.
2. Atualizar estado/variáveis em `resize` e `scroll` do `visualViewport`, com cleanup ao fechar modal.
3. Definir fallback para SSR e browsers sem `visualViewport`.
4. Usar Radix Dialog para portal, overlay, content, title, description e close.

### Fase 2: migrar `ProductManagerSheet`

Arquivos previstos:

- Modificar `src/components/product-manager-sheet.tsx`.
- Remover import de `vaul` desse arquivo.
- Manter `ProductManagerSheetProps` e comportamento de `open`, `onOpenChange`, `type`, `product`.

Tarefas:

1. Trocar `DrawerPrimitive.Root/Portal/Overlay/Content/Title/Description` pelo novo dialog.
2. Mover botões de submit/cancelamento para footer fixo/sticky do modal.
3. Garantir que o `form` continue envolvendo semanticamente os campos e botões, ou associar footer ao form via atributo `form`.
4. Preservar textos em português.
5. Preservar estados de loading, edição e criação.

### Fase 3: revisar CSS global do Vaul

Arquivos previstos:

- Modificar `src/app/globals.css`.

Tarefas:

1. Remover ou restringir regras globais `[data-vaul-drawer]` adicionadas para o modal de produto se nenhum outro drawer depender delas.
2. Verificar drawers de categoria/confirmação que ainda usam Vaul antes de remover regras globais.
3. Evitar `transform: translate3d(0, 0, 0) !important` global se ele mascarar animações ou reposicionamento de outros drawers.

### Fase 4: acessibilidade e interação

Tarefas:

1. Garantir `Dialog.Title` e `Dialog.Description` presentes.
2. Testar Escape, clique no overlay, botão fechar, Tab/Shift+Tab e retorno de foco.
3. Confirmar que o botão principal é alcançável com teclado virtual aberto.
4. Garantir que o body da página não role por trás do modal em iOS.

### Fase 5: validação manual em dispositivos

Matriz mínima:

| Plataforma | Cenários |
| --- | --- |
| iOS Safari | criar produto, editar produto, focar nome, preço, quantidade, alternar teclado, usar Done, tocar fora, fechar modal. |
| Chrome iOS | mesmos cenários, com atenção a scroll e foco. |
| Android Chrome | teclado textual e numérico, botão voltar para fechar teclado, salvar com teclado aberto. |
| Desktop responsivo | viewport mobile no DevTools, desktop normal, navegação por teclado. |

Verificações esperadas:

- sem espaço branco excessivo entre conteúdo e teclado.
- campo focado visível ou alcançável via scroll interno.
- botões de ação sempre acessíveis.
- scroll restrito ao conteúdo do modal.
- ao fechar teclado, altura do modal restaura corretamente.
- ao fechar modal, foco e scroll da página retornam de forma previsível.

---

## Arquivos impactados estimados

| Arquivo | Impacto |
| --- | --- |
| `src/components/product-manager-sheet.tsx` | Migração principal do Vaul para novo dialog, reorganização de layout/header/body/footer. |
| `src/components/responsive-product-dialog.tsx` | Novo componente de infraestrutura para modal responsivo. |
| `src/hooks/useVisualViewportSize.ts` | Hook opcional para controle explícito de Visual Viewport. |
| `src/app/globals.css` | Remoção/restrição de CSS global específico de Vaul, se seguro. |
| `src/components/ui/sheet.tsx` | Provavelmente sem alteração; pode servir apenas como referência Radix. |
| `src/components/currency-input.tsx` | Possível ajuste de `inputMode`, `font-size` ou props se o teclado numérico continuar instável. |

---

## Estimativa de esforço

| Atividade | Estimativa |
| --- | --- |
| Criar dialog/hook e layout base | 0,5 dia |
| Migrar `ProductManagerSheet` preservando criação/edição | 0,5 dia |
| Ajustar CSS global e regressões em outros drawers | 0,25 dia |
| Validação manual em desktop/DevTools | 0,25 dia |
| Validação em dispositivos reais iOS/Android e ajustes finos | 0,5 a 1 dia |

Estimativa total: 2 a 2,5 dias, dependendo da disponibilidade de dispositivos reais para teste.

---

## Riscos e impactos

### Riscos da solução recomendada

- Perda do gesto nativo de swipe-to-close fornecido pelo Vaul.
- Necessidade de acertar manualmente scroll lock e safe area em iOS.
- Regressão visual se o novo bottom sheet não reproduzir espaçamentos/animações atuais.
- Diferenças entre `visualViewport` real em dispositivos e em DevTools.

### Mitigações

- Usar Radix Dialog para manter base de acessibilidade sólida.
- Manter animações Tailwind equivalentes ao sheet atual (`slide-in-from-bottom`, `slide-out-to-bottom`).
- Fazer a migração apenas no modal de produto primeiro, sem trocar drawers simples de categoria/confirmação.
- Manter API externa de `ProductManagerSheet` para reduzir impacto em `CategoryClient` e `NewProductForm`.
- Validar em dispositivo real antes de considerar a correção definitiva.

### Impactos positivos esperados

- Menos dependência de heurísticas externas do Vaul.
- Botões de ação acessíveis com teclado aberto.
- Scroll interno previsível.
- Melhor capacidade de depuração, porque o comportamento de viewport passa a estar no código do app.
- Base reutilizável para outros formulários mobile, se necessário.

---

## Decisão recomendada

Não investir em uma terceira tentativa puramente CSS sobre Vaul para o modal de produto. As evidências indicam que o componente atual possui limitações estruturais para esse uso específico.

A próxima PR de implementação deve migrar somente o modal de criação/edição de produtos para um dialog responsivo próprio baseado em Radix Dialog, com controle explícito da área visível e footer de ações separado. Vaul pode continuar sendo usado em drawers simples sem inputs críticos, onde seu modelo de interação é menos arriscado.
