# Design: Correção de bugs no modal de produto após perda de foco no mobile

**Data:** 2026-06-07  
**Branch:** fix+modal-mobile-keyboard-layout  
**Escopo:** Dois bugs no fluxo de criação e edição de produto que se manifestam após o app ser enviado ao background

---

## Problema

Após o app perder foco (tela bloqueada, troca de aplicativo, aba em background), os fluxos de criação e edição de produto apresentam comportamento incorreto ao retornar:

- **Criação:** Toast de erro é exibido, mas o produto é criado no servidor
- **Edição:** O modal abre com campos vazios

O app é acessado via browser (não PWA instalado), portanto o estado React persiste durante o background. Os bugs são causados por falhas no código, não por lifecycle do browser.

---

## Diagnóstico

### Bug 1 — `onSubmit` não aguarda `managerProduct`

**Localização:** `src/components/product-manager-sheet.tsx:54-58`

```typescript
// Antes (bugado)
const onSubmit = methods.handleSubmit((data) => {
  managerProduct({ product: { ...data, categoryId: data.categoryId } });
  methods.reset();           // executa antes do fetch completar
  onOpenChange?.(false);     // fecha modal antes de saber o resultado
});
```

O modal fecha e o form é resetado imediatamente, antes da requisição terminar. Se a requisição falha (rede instável ao voltar do background), o toast de erro aparece com o modal já fechado. Se o servidor processou a requisição antes de retornar erro de rede/resposta, o produto existe mas o usuário viu erro.

### Bug 2 — `managerProduct` não relança o erro

**Localização:** `src/context/ProductContext.tsx:172-174`

```typescript
// Antes
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred');
  // sem throw — caller não consegue saber se houve erro
}
```

Sem o `throw err`, o `await managerProduct()` no `onSubmit` nunca lança exceção. O `try/catch` do caller nunca entra no `catch`, e o modal fecha mesmo quando houve falha.

### Bug 3 — Stale closure em `setCategories`

**Localização:** `src/context/ProductContext.tsx` — todas as operações que chamam `setCategories`

```typescript
// Antes
setCategories(categories.map(category => ({ ... })));
//            ↑ capturado no render anterior — pode estar obsoleto
```

Se entre o submit e a resposta da API o estado `categories` for atualizado por outra operação, o `setCategories` sobrescreve o estado atual com dados obsoletos.

### Bug 4 — `categories.length` e `methods` como deps do `useEffect`

**Localização:** `src/components/product-manager-sheet.tsx:113`

```typescript
}, [open, product?._id, isEdit, categories.length, selectedCategoryId, methods]);
```

- `categories.length`: ao adicionar/remover qualquer categoria com o modal aberto, o effect re-executa, abortando o fetch do produto em edição e reiniciando o form em criação
- `methods`: referência estável do React Hook Form, não precisa estar nas deps

### Bug 5 — Falha no fetch de edição sem feedback

**Localização:** `src/components/product-manager-sheet.tsx:87-93`

```typescript
// Antes
} catch (error) {
  if ((error as { name?: string }).name !== 'AbortError') {
    console.error('Error fetching product:', error);
    // modal permanece aberto com campos vazios
  }
}
```

Quando o fetch do produto falha, o modal abre com campos vazios e nenhum feedback ao usuário.

---

## Solução (Opção A — Correções cirúrgicas)

Cinco mudanças cirúrgicas em dois arquivos.

### Fix 1 — `onSubmit` async com fechamento condicional

**Arquivo:** `src/components/product-manager-sheet.tsx`

```typescript
const onSubmit = methods.handleSubmit(async (data) => {
  try {
    await managerProduct({ product: { ...data, categoryId: data.categoryId } });
    methods.reset();
    onOpenChange?.(false);
  } catch {
    // erro já tratado no managerProduct (toast + setError)
  }
});
```

O modal só fecha se a operação tiver sucesso. Se falhar, permanece aberto com os dados preenchidos.

### Fix 2 — `managerProduct` relança o erro

**Arquivo:** `src/context/ProductContext.tsx`

```typescript
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred');
  throw err;  // ← permite ao caller reagir à falha
}
```

### Fix 3 — Functional updates em `setCategories`

**Arquivo:** `src/context/ProductContext.tsx` — todas as operações: create, edit (duas branches), delete, toggleCart; e `addCategory` em `CategoryContext.tsx`

```typescript
// Padrão antes
setCategories(categories.map(category => ({ ... })));

// Padrão depois
setCategories(prev => prev.map(category => ({ ... })));
```

O callback `prev =>` recebe sempre o estado atual do React no momento da execução.

### Fix 4 — Corrigir deps do `useEffect`

**Arquivo:** `src/components/product-manager-sheet.tsx`

```typescript
// Antes
}, [open, product?._id, isEdit, categories.length, selectedCategoryId, methods]);

// Depois
}, [open, product?._id, isEdit, selectedCategoryId]);
```

A guarda `categories.length > 0` dentro do effect pode permanecer — ela previne reset do form antes das categorias carregarem, mas não precisa ser dep do effect.

### Fix 5 — Toast + fechar modal se fetch de edição falhar

**Arquivo:** `src/components/product-manager-sheet.tsx`

```typescript
} catch (error) {
  if ((error as { name?: string }).name !== 'AbortError') {
    toast.error('Não foi possível carregar o produto. Tente novamente.');
    onOpenChange?.(false);
  }
}
```

---

## Arquivos modificados

| Arquivo | Fixes |
|---------|-------|
| `src/components/product-manager-sheet.tsx` | Fix 1, Fix 4, Fix 5 |
| `src/context/ProductContext.tsx` | Fix 2, Fix 3 (managerProduct, removeProduct, removeAllProducts, toggleCart) |
| `src/context/CategoryContext.tsx` | Fix 3 (addCategory, removeCategory) |

---

## Comportamento esperado após a correção

- **Criação:** Modal permanece aberto se a requisição falhar; fecha normalmente no sucesso
- **Criação (rede instável):** Toast de erro aparece com modal ainda aberto; usuário pode tentar novamente
- **Edição:** Se o fetch do produto falhar, modal fecha com toast de erro (não fica aberto com campos vazios)
- **Estado:** Nenhuma operação sobrescreve o estado de categorias com dados obsoletos

---

## Fora do escopo

- Revalidação de sessão NextAuth no foco (`refetchOnWindowFocus`) — pode ser endereçada se o bug persistir após estas correções
- Listener de `visibilitychange` para refresh proativo de categorias
- Loop de re-render potencial no `useEffect` do `CategoryContext` (`filterCategory` → `filteredCategory` → re-run)
