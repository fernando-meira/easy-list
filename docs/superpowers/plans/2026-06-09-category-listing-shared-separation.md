# Category Listing — Separação Owned × Shared — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o design Pencil da tela Categories Listing (PD2CM) para separar listas próprias ("Minhas listas") de listas compartilhadas ("Compartilhadas"), com badge de ícone `users` (Lucide) nos cards shared.

**Architecture:** Todas as mudanças são no arquivo `EasyList.pen` via Pencil MCP. Nenhum código da aplicação é modificado nesta iteração. Os cards shared usam override inline de instâncias `CgRQb` — sem criar novo componente.

**Tech Stack:** Pencil MCP (`batch_design`, `Replace`, `Insert`, `Move`, `get_screenshot`), Lucide icon library, tokens do design system EasyList (`$color.ink`, `$color.muted`, `$color.surface-card`).

**Arquivo:** `C:/Users/ThomW/OneDrive/Documentos/Design Pencil/EasyList/EasyList.pen`

**Nó alvo:** `PD2CM` (Categories Listing)

**IDs relevantes no PD2CM:**
| ID | Nome |
|---|---|
| `DtuUz` | App Header |
| `FJoS6` | Page Title "Categorias" |
| `FQUpW` | Atualizadas Section |
| `uGKvk` | Antigas Section |
| `D7wS11` | Add Category Button |

**IDs relevantes no componente `CgRQb` (Category Card):**
| ID | Nome |
|---|---|
| `ja1iE` | Category Name (text) |
| `p1WY50` | Product Badge (frame) |
| `Xn2Qj` | Stat Number (text, dentro de p1WY50) |
| `vg59Y` | Card Divider |
| `n0K2b` | Delete Row |

---

### Task 1: Criar container "Minhas listas" e mover seções existentes

**Files:**
- Modify: `EasyList.pen` — reorganizar filhos de PD2CM

- [ ] **Step 1: Inserir frame "Minhas Listas Section" e mover seções para dentro**

Executar `batch_design` com o snippet abaixo. Não usar `const`/`let` para que `minhasSection` persista entre chamadas.

```js
minhasSection = Insert("PD2CM", {
  type: "frame",
  name: "Minhas Listas Section",
  layout: "vertical",
  gap: 12,
  width: "fill_container"
})
Move(minhasSection, "PD2CM", 2)
Insert(minhasSection, {
  type: "text",
  name: "Minhas Listas Label",
  content: "Minhas listas",
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: "600",
  fill: "$color.ink"
})
Move("FQUpW", minhasSection, 1)
Move("uGKvk", minhasSection, 2)
```

- [ ] **Step 2: Verificar estrutura com batch_get**

Executar `batch_get` em `PD2CM` com `readDepth: 3` e confirmar:

Filhos esperados de PD2CM (em ordem):
1. `DtuUz` — App Header
2. `FJoS6` — Page Title
3. `minhasSection` — Minhas Listas Section
4. `D7wS11` — Add Category Button

Filhos esperados de `minhasSection` (em ordem):
1. texto "Minhas listas" (fontWeight: "600", fill: "$color.ink")
2. `FQUpW` — Atualizadas Section
3. `uGKvk` — Antigas Section

---

### Task 2: Adicionar seção "Compartilhadas" com card exemplo

**Files:**
- Modify: `EasyList.pen` — inserir nova seção em PD2CM

- [ ] **Step 1: Criar frame "Compartilhadas Section" com label e posicioná-lo antes do botão**

```js
compartSection = Insert("PD2CM", {
  type: "frame",
  name: "Compartilhadas Section",
  layout: "vertical",
  gap: 8,
  width: "fill_container"
})
Move(compartSection, "PD2CM", 3)
Insert(compartSection, {
  type: "text",
  name: "Compartilhadas Label",
  content: "Compartilhadas",
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: "600",
  fill: "$color.ink"
})
```

- [ ] **Step 2: Inserir card "Casa" como instância shared de CgRQb**

Desativar Delete Row (`n0K2b`) e divider (`vg59Y`), e nomear a categoria.

```js
sharedCard = Insert(compartSection, {
  type: "ref",
  ref: "CgRQb",
  name: "Casa Card",
  width: "fill_container",
  descendants: {
    "ja1iE": { content: "Casa" },
    "vg59Y": { enabled: false },
    "n0K2b": { enabled: false }
  }
})
```

- [ ] **Step 3: Substituir Product Badge pelo Shared Badge (Users + contagem)**

Substituir o frame `p1WY50` por um novo badge com ícone Users + número + label.

```js
sharedBadge = Replace(sharedCard + "/p1WY50", {
  type: "frame",
  name: "Shared Badge",
  layout: "horizontal",
  alignItems: "center",
  gap: 6,
  fill: "$color.surface-card",
  cornerRadius: 9999,
  padding: [9, 12]
})
Insert(sharedBadge, {
  type: "icon",
  name: "Users Icon",
  library: "lucide",
  icon: "users",
  width: 12,
  height: 12,
  fill: "$color.ink"
})
Insert(sharedBadge, {
  type: "text",
  name: "Count",
  content: "9",
  fontFamily: "Inter",
  fontSize: 13,
  fontWeight: "500",
  fill: "$color.ink"
})
Insert(sharedBadge, {
  type: "text",
  name: "Label",
  content: "produtos",
  fontFamily: "Inter",
  fontSize: 13,
  fontWeight: "500",
  fill: "$color.ink"
})
```

- [ ] **Step 4: Verificar card compartilhado**

Executar `batch_get` em `sharedCard` com `resolveInstances: true`, `readDepth: 4` e confirmar:
- `n0K2b` com `enabled: false`
- `vg59Y` com `enabled: false`
- Shared Badge frame com 3 filhos: `icon(users)` → `text("9")` → `text("produtos")`

---

### Task 3: Verificação visual final

**Files:** nenhum — apenas inspeção

- [ ] **Step 1: Capturar screenshot de PD2CM**

Executar `get_screenshot` no nó `PD2CM` e confirmar visualmente:

| Checklist | Esperado |
|---|---|
| Label "Minhas listas" | Inter 14 w600 ink, acima dos sub-labels |
| Sub-labels "Atualizadas" / "Antigas" | preservados dentro de "Minhas Listas Section" |
| Cards owned | com ícone trash na Delete Row |
| Label "Compartilhadas" | Inter 14 w600 ink, seção separada abaixo |
| Card "Casa" | sem linha cinza, sem trash |
| Badge card "Casa" | `[users icon] 9 produtos` com fundo surface-card |
| Botão "Adicionar categoria" | último elemento da tela |

- [ ] **Step 2: Ajustar se necessário**

Se algum item do checklist falhar, corrigir inline com `Update` ou `batch_design` antes de concluir.
