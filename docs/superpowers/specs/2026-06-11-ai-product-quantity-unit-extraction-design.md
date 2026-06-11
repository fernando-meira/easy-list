# Design: Extração de Quantidade e Unidade na Geração de Listas via IA

**Data:** 2026-06-11
**Status:** Aprovado

---

## Problema

A IA gera produtos com quantidade e unidade embutidos no nome (ex: "Carne suína lombo em bifes 1kg"). Os campos `quantity` e `unit` do modelo `ProductProps` existem na API mas não são alimentados pelo fluxo de geração via IA.

---

## Solução

Expandir o schema de resposta da IA para incluir `quantity` e `unit` por produto. Claude extrai, estrutura e limpa o nome em uma única chamada. A `AiReviewListDrawer` exibe os campos extraídos com edição inline antes da confirmação.

---

## Decisões de Design

| Decisão | Escolha |
|---|---|
| Unidades não suportadas (ml, l) | Mapear para `uni.` como fallback |
| UX no drawer de revisão | Exibir e permitir edição inline |
| Nome do produto | Limpar — remover a parte de quantidade/unidade extraída |

---

## Arquitetura

**Arquivos afetados: 3 (nenhum novo)**

### 1. `src/types/interfaces.ts`

Expandir `AiGeneratedList.products` de `{ name: string }` para:

```ts
export interface AiGeneratedList {
  categoryName: string;
  products: {
    name: string;
    unit?: string;
    quantity?: string;
  }[];
}
```

---

### 2. `src/app/api/ai/generate-list/route.ts`

**System prompt — formato de resposta atualizado:**

```
Responda APENAS com JSON válido, sem texto adicional, no formato:
{
  "categoryName": string,
  "products": [{
    "name": string,
    "quantity"?: string,
    "unit"?: "kg" | "g" | "uni"
  }]
}

Regras de extração:
- Extraia quantidade e unidade do nome quando houver (ex: "1kg" → quantity:"1", unit:"kg")
- Limpe o nome: remova a parte de quantidade/unidade extraída do campo name
- Use apenas os valores: "kg", "g", "uni" para o campo unit
- Para ml, l, unidades, itens, pacotes → use "uni"
- "10 unidades" → quantity:"10", unit:"uni"
- Se não houver quantidade explícita, omita os campos quantity e unit
```

**Função `normalizeUnit`** (server-side):

Mapeia a string retornada pela IA para o `UnitEnum` existente:

```ts
const UNIT_MAP: Record<string, UnitEnum> = {
  kg: UnitEnum.kg,
  g: UnitEnum.grams,
  uni: UnitEnum.unit,
};

function normalizeUnit(raw?: string): UnitEnum | undefined {
  if (!raw) return undefined;
  return UNIT_MAP[raw.toLowerCase()] ?? undefined;
}
```

A normalização é aplicada antes de retornar o resultado ao cliente, convertendo os campos `unit` de cada produto.

**Tipo de retorno de `callClaude`** atualizado para refletir o novo schema.

---

### 3. `src/components/ai-review-list-drawer.tsx`

**Estado local:**

```ts
// antes
const [products, setProducts] = useState<{ name: string }[]>([]);

// depois
const [products, setProducts] = useState<AiGeneratedList['products']>([]);
```

**Cards de produto:**

- Quando a IA extrai `quantity` ou `unit`: o card exibe uma segunda linha com input de quantidade (type="number", step=0.1) e segmented control de unidade (Un. / Kg / Gr)
- Quando nada é extraído: card permanece como hoje (somente nome + botão remover)
- Ambos os campos são editáveis inline no card

Layout do card com dados extraídos:
```
┌──────────────────────────────────────────┐
│ Carne suína lombo em bifes          [✕]  │
│ [  1  ]  [ Un. ] [ Kg ] [ Gr ]           │
└──────────────────────────────────────────┘
```

**Payload de criação:**

```ts
body: JSON.stringify({
  name: product.name,
  unit: product.unit,
  quantity: product.quantity,
  categoryId: category._id,
})
```

Campos `unit` e `quantity` são enviados apenas quando presentes (não enviar `undefined` explicitamente).

---

## Fluxo Completo

```
Usuário digita prompt
       ↓
POST /api/ai/generate-list
       ↓
Claude retorna { categoryName, products: [{ name, quantity?, unit? }] }
       ↓
normalizeUnit() converte unit string → UnitEnum
       ↓
AiReviewListDrawer exibe produtos com quantity/unit editáveis
       ↓
Usuário confirma → POST /api/products (com name limpo + quantity + unit)
```

---

## Cenários de Borda

| Cenário | Comportamento |
|---|---|
| IA retorna "ml", "l", "litros" | Normaliza para `uni.`; usuário pode ajustar |
| IA não extrai nada | Card permanece compacto; sem campos extras |
| IA retorna quantity mas não unit | Input de quantidade aparece; unit padrão: `uni.` |
| Nome após limpeza fica vazio | Improvável — Claude mantém o nome do produto |
| Usuário edita quantity para valor inválido | Input type="number" previne valores não numéricos |

---

## Fora de Escopo

- Expansão do `UnitEnum` com `ml` e `l`
- Edição do nome do produto no drawer de revisão
- Exibição de quantidade/unidade nos cards de produto já criados (comportamento existente)
