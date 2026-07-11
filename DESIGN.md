---
name: Easy List
description: Um caderno de compras de bolso — superfícies brancas e quietas, tipografia nítida, profundidade por hairline, feito para o polegar no corredor do mercado.
colors:
  ink: "#111111"
  canvas: "#ffffff"
  muted: "#6b7280"
  primary: "#111111"
  success: "#10b981"
  error: "#ef4444"
  hairline: "#e5e7eb"
  on-primary: "#ffffff"
  surface-soft: "#f8f9fa"
  surface-card: "#f5f5f5"
  surface-dark: "#101010"
  surface-dark-elevated: "#1a1a1a"
  on-dark: "#ffffff"
  on-dark-soft: "#a1a1aa"
  ink-dark: "#ffffff"
  canvas-dark: "#101010"
  muted-dark: "#a1a1aa"
  hairline-dark: "#27272a"
  surface-card-dark: "#1a1a1a"
typography:
  display:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.5px"
  title:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.3px"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  body-strong:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
  meta:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  icon-button-circular:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "34px"
  count-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.full}"
    padding: "9px 12px"
  category-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  product-row-pending:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "68px"
  product-row-cart:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.muted}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "68px"
  cart-toggle:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: "34px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "40px"
  state-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.lg}"
    padding: "12px"
  header-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "56px"
---

# Design System: Easy List

## 1. Overview

**Creative North Star: "A Lista de Bolso"**

Easy List é uma lista de compras que cabe no bolso e no polegar. A interface se comporta como um app nativo leve: compacta, previsível de tela em tela, e sem nenhuma decoração que compita com a tarefa. A superfície é branca e quieta (`{colors.canvas}` — #ffffff), a tipografia é nítida, e a profundidade vem de fios de 1px (`{colors.hairline}` — #e5e7eb) e da troca de fundo, nunca de sombras teatrais. Tudo é calibrado para uso apressado: antes de sair de casa, no corredor do mercado, ou revisando itens depois.

O sistema roda em duas camadas de token que coexistem de propósito. A camada **shadcn/Radix** (`--primary`, `--muted`, `--border`, em HSL) veste os primitivos de formulário e diálogo (`ui/*`): botões, inputs, selects, sheets. A camada **de produto** (`--color-*`, em hex) veste as telas de assinatura — categorias, linhas de produto, cabeçalho, estados. As duas apontam para o mesmo espírito monocromático: tinta quase-preta (`{colors.ink}` — #111111) sobre branco, com um único cinza de superfície (`{colors.surface-card}` — #f5f5f5) fazendo o trabalho de separação. Cor saturada só aparece com significado: verde de sucesso (`{colors.success}`) e vermelho de erro/destrutivo (`{colors.error}`).

O que este sistema explicitamente rejeita, seguindo o PRODUCT.md: dashboard corporativo, landing SaaS genérica, app de produtividade excessivamente complexo, experiência gamificada ou chamativa. Sem decoração visual gratuita, sem cards aninhados, sem excesso de modais, sem animação que atrase a tarefa.

**Key Characteristics:**
- Monocromático no nível da ação: ink #111 sobre canvas branco. Cor só com significado (sucesso, erro).
- Profundidade por hairline (1px #e5e7eb) e troca de fundo (canvas vs surface-card), não por sombra.
- Mobile-first de verdade: container `max-w-3xl`, cabeçalho fixo de 56px, alvos de toque redondos de 34px.
- Estado do item legível de relance: pendente = fundo branco + tinta cheia; no carrinho = fundo cinza + texto apagado + check preenchido.
- Cal Sans carrega os títulos; Inter carrega o corpo. Nunca o contrário.
- Duas camadas de token (shadcn HSL + produto hex) que compartilham a mesma paleta e nunca se contradizem.

## 2. Colors

Paleta quase-monocromática: preto-e-branco no nível da ação, um único cinza de superfície para separar, e dois semânticos (verde/vermelho) usados só quando comunicam estado.

### Primary
- **Tinta** (`{colors.ink}` / `{colors.primary}` — #111111): a cor dominante. Todo título, texto principal, botão primário, ícone ativo e o círculo "no carrinho" preenchido. No dark mode inverte para branco (`{colors.ink-dark}` — #ffffff). Botão primário shadcn usa `hover:bg-primary/90`.

### Neutral
- **Canvas** (`{colors.canvas}` — #ffffff): o piso padrão da página, o fundo do cabeçalho fixo e das linhas de item pendente. No dark: #101010.
- **Surface Card** (`{colors.surface-card}` — #f5f5f5): o único cinza de superfície. Preenche botões-ícone redondos, pílulas de contagem, state-cards, e linhas de item já no carrinho. No dark: #1a1a1a.
- **Surface Soft** (`{colors.surface-soft}` — #f8f9fa): divisor de seção muito suave, wrappers agrupados. Uso raro.
- **Hairline** (`{colors.hairline}` — #e5e7eb): o fio de 1px que faz toda a separação entre superfícies planas. Bordas de card, linhas de produto, borda inferior do cabeçalho, contorno de input. No dark: #27272a.
- **Muted** (`{colors.muted}` — #6b7280): texto secundário — metadados de produto, rótulos de agrupamento ("Atualizadas", "Antigas"), e-mail no cabeçalho, e o nome de item já no carrinho. No dark: #a1a1aa.
- **On Primary** (`{colors.on-primary}` — #ffffff): texto e ícones sobre superfícies ink (botão primário, círculo do carrinho, botão "Entrar").
- **Surface Dark / Dark Elevated** (`{colors.surface-dark}` — #101010 / `{colors.surface-dark-elevated}` — #1a1a1a): superfícies escuras herdadas da camada de token; no app claro são reservadas, não decorativas. `on-dark` / `on-dark-soft` são os textos correspondentes.

### Secondary (semânticos)
- **Sucesso** (`{colors.success}` — #10b981): confirmação e o ícone de estado vazio positivo (PackagePlus). Nunca decorativo.
- **Erro** (`{colors.error}` — #ef4444): ícones de excluir/remover (Trash2), alerta de erro (TriangleAlert), e mapeia para o `destructive` do shadcn (#ef4444). Reservado para ações e estados destrutivos.

### Named Rules
**A Regra do Cinza Único.** Toda separação de superfície é feita por `{colors.hairline}` ou por trocar entre `{colors.canvas}` e `{colors.surface-card}`. Não invente uma terceira superfície cinza para "dar variedade"; a escassez é o que mantém a tela calma.

**A Regra da Cor com Significado.** `{colors.success}` e `{colors.error}` só aparecem quando comunicam estado ou ação (sucesso, excluir, erro). Cor saturada nunca é enfeite e nunca aparece em estado inativo.

## 3. Typography

**Display Font:** Cal Sans (com fallback Inter, sans-serif)
**Body Font:** Inter (com fallback sans-serif)

**Character:** Cal Sans é a voz dos títulos — geométrica, peso 600, com letter-spacing negativo (-0.3 a -0.5px) que a deixa moderna e precisa. Inter carrega tudo que é leitura e UI: nome de produto, metadados, rótulos, corpo. A fronteira é estrita e o `font-sans` global lista `['Cal Sans', 'var(--font-inter)', 'sans-serif']`.

### Hierarchy
- **Display** (Cal Sans 600, 28px, 1.2, -0.5px): o h1 de tela ("Categorias"). É o maior tipo do produto — sem clamp, sem heróis gigantes; é um app, não uma landing.
- **Title** (Cal Sans 600, 18px, 1.3, -0.3px): títulos de drawer/sheet e cabeçalhos de seção com peso.
- **Body Strong** (Inter 600, 15px, 1.4): nome de produto, nome de categoria, o rótulo primário de cada linha.
- **Body** (Inter 400, 15px, 1.5): texto corrido e valor de input. Prosa longa fica em 65–75ch.
- **Label** (Inter 500, 13px, 1.4): rótulos de botão, contagem em pílula, chips de metadados curtos.
- **Meta** (Inter 400, 12px, 1.4): metadados de produto (preço/quantidade), texto de state-card, linha de e-mail no cabeçalho.

### Named Rules
**A Regra dos Dois Papéis.** Cal Sans só para título; Inter só para corpo e UI. Nunca coloque nome de produto ou metadado em Cal Sans, nunca coloque um h1 em Inter.

**A Regra do Teto Baixo.** O maior tipo do produto é 28px. Isto é uma ferramenta de bolso; não há headline de 4rem. Ênfase vem de peso e posição, não de tamanho gigante.

## 4. Elevation

Este sistema é **plano por padrão**. Nas telas de produto a profundidade é comunicada por dois meios: o fio de 1px `{colors.hairline}` que contorna cada superfície, e a troca de fundo entre `{colors.canvas}` e `{colors.surface-card}`. Não há sombra nas telas de produto — categorias, linhas, cabeçalho e estados são todos planos, separados por hairline. Isso mantém a leitura rápida sob luz variável e no celular.

Os primitivos shadcn (`ui/card`, `ui/button`, `ui/input`) trazem uma sombra leve embutida (`shadow` / `shadow-sm`) da biblioteca. Ela é tolerada dentro de formulários e diálogos, mas **não deve ser propagada** para as telas de produto. Quando um card de produto e um `ui/card` aparecem na mesma tela, o de produto (plano + hairline) é o padrão correto.

### Named Rules
**A Regra do Plano-por-Padrão.** Superfícies são planas em repouso. Se você está prestes a adicionar `box-shadow` a uma tela de produto, use hairline ou troca de fundo em vez disso. Sombra é resíduo da lib, não linguagem do sistema.

## 5. Components

Feel geral: **nítido e sem atrito**. Cada controle diz exatamente o que faz, responde rápido e não tem enfeite. Ergonomia de polegar em primeiro lugar.

### Buttons
- **Shape:** cantos suaves de 8px (`{rounded.md}`); botões-ícone e alvos de toque são círculos perfeitos (`{rounded.full}`).
- **Primary:** fundo `{colors.primary}` (#111), texto `{colors.on-primary}`, altura 40px, `{typography.label}`. Hover escurece via `bg-primary/90`. Foco: `ring-1 ring-ring`.
- **Outline:** fundo `{colors.canvas}` com borda `{colors.hairline}`, texto ink. Hover cai para o accent shadcn.
- **Ghost:** transparente; hover ganha fundo accent. Usado em ações secundárias dentro de linhas.
- **Icon circular:** 34px, fundo `{colors.surface-card}`, ícone ink (ou `{colors.error}` para excluir). O botão redondo de superfície-cinza é a assinatura de ação do produto.
- **ActionButton (rodapé de sheet):** largura total, padding grande, `rounded-t-sm rounded-b-none`, borda hairline sem base, fundo transparente — desenhado para empilhar como abas de ação no pé de um drawer.

### Chips / Badges
- **Count pill:** pílula (`{rounded.full}`) em `{colors.surface-card}`, texto `{typography.meta}` ink, padding ~9px×12px. Mostra "N produtos"; ganha ícone `Users` quando a lista é compartilhada.
- **Badge (shadcn):** `{rounded.md}`, variantes default (ink), secondary (cinza), destructive (erro), outline. Uso pontual.

### Cards / Containers
- **Corner Style:** `{rounded.lg}` (12px) para linhas e cards de produto; `{rounded.xl}` (16px) só para o `ui/card` shadcn.
- **Background:** `{colors.canvas}` para conteúdo pendente/ativo; `{colors.surface-card}` para estado "resolvido" (no carrinho) e para state-cards.
- **Shadow Strategy:** nenhuma nas telas de produto (ver Elevation).
- **Border:** 1px `{colors.hairline}` sempre.
- **Internal Padding:** 14px×16px para linha de categoria; 10px×12px para linha de produto; 12px para state-card.

### Inputs / Fields
- **Style:** fundo `{colors.canvas}`, borda 1px `{colors.hairline}`, `{rounded.md}`, altura 40px, `{typography.body}`. Placeholder em `{colors.muted}`.
- **Focus:** `focus-visible:ring-1 ring-ring`, sem glow.
- **Disabled:** `opacity-50`, cursor bloqueado.

### Navigation / Header
- **Header bar:** fixo no topo, altura 56px, fundo `{colors.canvas}`, borda inferior `{colors.hairline}`, `max-w-3xl` centralizado, `z-10`. À esquerda: avatar + saudação (ou logo ShoppingBasket + wordmark "EasyList"). À direita: toggle de tema (círculo outline) e sair/entrar. Estado de carregamento usa skeletons de pulso, não spinner.

### Signature: Product Row (pendente vs carrinho)
A linha de produto é o componente central. Dois estados legíveis de relance:
- **Pendente:** fundo `{colors.canvas}`, nome em ink cheio, círculo de toggle 34px vazio com borda hairline.
- **No carrinho:** fundo `{colors.surface-card}`, nome em `{colors.muted}`, círculo 34px preenchido em `{colors.primary}` com `Check` branco.
Altura fixa 68px, transição de opacidade de 200ms ao excluir, e dois botões-ícone circulares (editar em ink, excluir em erro) à direita.

## 6. Do's and Don'ts

### Do:
- **Do** manter ink #111 sobre canvas branco como a relação de ação padrão. O produto é monocromático no nível da ação.
- **Do** separar superfícies com hairline de 1px (`{colors.hairline}`) ou troca de fundo canvas↔surface-card. Nada mais.
- **Do** usar `{colors.success}` e `{colors.error}` só quando comunicam estado ou ação.
- **Do** deixar Cal Sans nos títulos e Inter no corpo; a fronteira não se mistura.
- **Do** manter alvos de toque redondos de 34px+ e ações frequentes perto do polegar.
- **Do** distinguir estado pendente vs carrinho por fundo + cor de texto + círculo, não só por um deles.
- **Do** usar skeletons de carregamento (não spinner no meio do conteúdo) e state-cards que ensinam ("Adicionar primeiro produto").

### Don't:
- **Don't** adicionar `box-shadow` a telas de produto. Plano por padrão; profundidade é hairline.
- **Don't** aninhar cards. Uma linha, uma superfície, um hairline (o PRODUCT.md proíbe cards aninhados).
- **Don't** introduzir uma terceira superfície cinza além de `{colors.surface-card}` / `{colors.surface-soft}`.
- **Don't** fazer o produto parecer dashboard corporativo, landing SaaS genérica, app de produtividade complexo, ou experiência gamificada/chamativa.
- **Don't** usar cor saturada como enfeite ou em estado inativo.
- **Don't** colocar título em Inter ou nome de produto/metadado em Cal Sans.
- **Don't** usar tipo gigante (heróis com clamp). O teto do produto é 28px.
- **Don't** empilhar modais nem usar animação que atrase a marcação de um item.
