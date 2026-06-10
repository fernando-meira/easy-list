# Design Spec: Criação de Lista Automática com IA

**Data:** 2026-06-10
**Status:** Aprovado

---

## Visão Geral

O usuário digita um prompt livre descrevendo o que precisa (ex: "lista para festa de aniversário infantil para 20 crianças"). A IA analisa o histórico de listas do usuário e gera automaticamente uma categoria com produtos sugeridos. Quando o histórico é insuficiente, a IA infere produtos adequados com base no pedido e conhecimento geral.

---

## Fluxo

```
[Usuário clica ✨ no footer]
       ↓
AiGenerateListDrawer abre
(campo de prompt + botão "Gerar lista")
       ↓
POST /api/ai/generate-list { prompt }
  1. Extrai userId da sessão
  2. Busca histórico do usuário no Firestore
  3. Monta system prompt com histórico como contexto
  4. Chama Claude (claude-sonnet-4-6)
  5. Retorna { categoryName, products }
       ↓
AiGenerateListDrawer fecha → AiReviewListDrawer abre
(lista de produtos, usuário remove indesejados com ✕)
       ↓
Usuário confirma →
  1. addCategory({ name: categoryName })
  2. addProduct({ name, categoryId }) para cada produto restante
  3. Redirect para a página da categoria criada
```

---

## Ponto de Entrada

Botão ✨ no [sticky-footer.tsx](../../../src/components/sticky-footer.tsx), ao lado esquerdo do botão principal "Nova lista". Dimensão `h-10 w-10`, ícone apenas, estilo de botão secundário seguindo o padrão visual do app.

---

## Novos Arquivos

| Arquivo | Descrição |
|---|---|
| `src/components/ai-generate-list-drawer.tsx` | Drawer de entrada com campo de prompt |
| `src/components/ai-review-list-drawer.tsx` | Drawer de revisão dos itens gerados |
| `src/app/api/ai/generate-list/route.ts` | API route que chama o Claude |

---

## Componente: `AiGenerateListDrawer`

**Props:** `open: boolean`, `onOpenChange: (open: boolean) => void`, `onGenerated: (result: AiGeneratedList) => void`

**Estados internos:**
- `idle` — campo vazio, botão habilitado
- `loading` — campo e botão desabilitados, spinner + "Gerando sua lista..."
- `error` — toast via `sonner`, drawer permanece aberto para nova tentativa

**Validação:** prompt não pode estar vazio (campo obrigatório, sem validação de comprimento mínimo).

**Ao sucesso:** fecha o drawer e chama `onGenerated` com `{ categoryName, products }`.

---

## Componente: `AiReviewListDrawer`

**Props:** `open: boolean`, `onOpenChange: (open: boolean) => void`, `categoryName: string`, `products: { name: string }[]`

**Comportamento:**
- Lista local mutável — cada produto tem um botão ✕ para remoção
- Botão de confirmação sempre habilitado; quando `products.length === 0`, label muda para "Criar categoria vazia"
- Durante criação: botão exibe spinner e fica desabilitado
- Ao confirmar: cria categoria via `addCategory`, cria cada produto via `addProduct`, fecha o drawer e redireciona para a página da categoria

---

## Tipo Compartilhado

```ts
interface AiGeneratedList {
  categoryName: string;
  products: { name: string }[];
}
```

---

## API Route: `POST /api/ai/generate-list`

**Auth:** protegida pelo middleware existente — `userId` extraído da sessão, nunca recebido do cliente.

**Request body:** `{ prompt: string }`

**Response (200):** `{ categoryName: string, products: { name: string }[] }`

**Response (500):** `{ error: string }`

### Lógica

1. Busca no Firestore as categorias do usuário + até 5 produtos por categoria
2. Monta o system prompt (ver abaixo)
3. Chama `claude-sonnet-4-6` com `max_tokens: 1024`
4. Faz parse do JSON retornado
5. Em caso de JSON inválido: retry automático 1x antes de retornar 500

---

## Prompt Engineering

### System Prompt

```
Você é um assistente de lista de compras.
Responda APENAS com JSON válido, sem texto adicional, no formato:
{ "categoryName": string, "products": [{ "name": string }] }

Gere entre 8 e 15 produtos por padrão, adequados ao contexto do pedido.
Os nomes devem estar em português do Brasil.
```

### Contexto de Histórico (quando disponível)

```
Histórico de compras do usuário:
- <categoria>: <produto1>, <produto2>, <produto3>
[...até 5 categorias mais recentes]

Use esse histórico como referência de preferências, mas adapte ao pedido atual.
```

### Mensagem do Usuário

O prompt digitado pelo usuário, sem modificação.

### Fallback sem Histórico

Omite a seção de histórico no prompt. O Claude gera com base no pedido e conhecimento geral.

---

## Tratamento de Erros

### API Route

| Cenário | Comportamento |
|---|---|
| JSON inválido retornado pelo Claude | Retry 1x; se falhar, retorna 500 |
| Timeout da API Anthropic (>30s) | Retorna 504 |
| `products` retornado vazio | Retorna 500 com mensagem específica |
| Usuário sem histórico | Prompt sem contexto de histórico — gera normalmente |

### Frontend

- Qualquer erro HTTP → toast via `sonner`: "Não foi possível gerar a lista. Tente novamente."
- Drawer permanece aberto para nova tentativa

---

## Edge Cases

| Caso | Comportamento |
|---|---|
| Usuário remove todos os produtos na revisão | Botão muda para "Criar categoria vazia"; cria só a categoria |
| `categoryName` retornado vazio | Usa o prompt do usuário truncado em 50 chars como fallback |
| Prompt muito curto (ex: "feira") | Aceito normalmente, sem validação de comprimento mínimo |

---

## Integrações com Código Existente

- **Autenticação:** middleware existente em `src/lib/auth.ts`
- **Firestore:** funções existentes em `src/lib/firestore-domain.ts`
- **Criação de categoria:** `addCategory` do `CategoryContext`
- **Criação de produto:** `addProduct` do `ProductContext`
- **Toasts:** `sonner` já instalado e configurado
- **Modelo Claude:** `claude-sonnet-4-6` via `@anthropic-ai/sdk` (nova dependência)
