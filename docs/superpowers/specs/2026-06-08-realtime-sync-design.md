# Real-time Sync entre Dispositivos — Design Spec

**Data:** 2026-06-08
**Branch:** feat/realtime-sync
**Status:** Aprovado — aguardando implementação

---

## Problema

Quando um usuário atualiza a lista em um dispositivo, a mudança não é refletida automaticamente nos outros dispositivos conectados à mesma conta. A lista só é atualizada quando o usuário recarrega manualmente a aplicação.

---

## Contexto técnico atual

- **Backend:** Firebase Firestore via Admin SDK (server-only)
- **State management:** React Context API (`CategoriesContextProvider`, `ProductsContextProvider`)
- **Carregamento inicial:** `fetchCategories()` em `CategoriesContextProvider` faz um único `GET /api/categories` na montagem
- **Mutations:** API routes (`/api/categories`, `/api/products`, `/api/products/[id]`) escrevem no Firestore via Admin SDK e atualizam o estado local otimisticamente
- **Sincronização atual:** Nenhuma — sem polling, WebSocket, SSE ou listeners real-time
- **Hospedagem:** Vercel (serverless)

---

## Decisões de design

| Questão | Decisão |
|---|---|
| Comportamento no dispositivo remoto | Atualização automática + toast "Lista atualizada" |
| Escopo do sync | Somente enquanto a lista está aberta (componente montado) |
| Conflito de edição simultânea | Última escrita vence (sem detecção explícita) |
| Hospedagem | Vercel — descarta SSE por limitação de timeout serverless |
| Abordagem escolhida | Firebase client SDK + `onSnapshot` |

---

## Arquitetura

### Princípio central

**Writes** continuam exclusivamente via API routes com Admin SDK — sem nenhuma mudança nas mutations existentes.

**Reads em real-time** são responsabilidade do Firebase client SDK no browser, autenticado via custom token.

### Fluxo completo

```
Login (NextAuth)
  ↓
GET /api/auth/firebase-token
  ↓ custom token (Admin SDK: createCustomToken(userId))
signInWithCustomToken(auth, token)
  ↓ sessão Firebase client-side ativa
onSnapshot(categories + products filtrados por userId)
  ↓ mudança detectada (de qualquer dispositivo)
setCategories(novosDados)
  ↓
toast("Lista atualizada")  ← só se mudança for remota
```

### Separação de responsabilidades

```
Writes:  Cliente → API Route → Admin SDK → Firestore
Reads:   Firestore → onSnapshot (client SDK) → Context → UI
```

---

## Componentes novos

### `src/lib/firebase-client.ts`

Inicializa o Firebase client SDK uma única vez. Exporta `auth` e `db` (Firestore client) para uso nos listeners.

```ts
// Inicialização com as mesmas credenciais públicas do projeto Firebase
// (NEXT_PUBLIC_FIREBASE_API_KEY, etc.)
export const app = initializeApp(clientConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
```

### `src/app/api/auth/firebase-token/route.ts`

Endpoint protegido por sessão NextAuth. Gera e retorna um custom token Firebase para o usuário autenticado.

```
GET /api/auth/firebase-token
→ 401 se sem sessão
→ 200 { token: string } se autenticado
```

Usa `admin.auth().createCustomToken(userId)` — o mesmo `userId` já presente em todas as queries Firestore.

### `src/hooks/useFirebaseAuth.ts`

Hook chamado uma única vez no `CategoriesContextProvider`. Responsável por:

1. Buscar o custom token via `GET /api/auth/firebase-token`
2. Chamar `signInWithCustomToken(auth, token)`
3. Retornar estado `{ isReady: boolean }` para habilitar os listeners

### Modificações em `src/context/CategoryContext.tsx`

- Substituir o `fetchCategories()` inicial por dois listeners `onSnapshot`:
  - `collection('categories') where('userId', '==', userId)`
  - `collection('products') where('userId', '==', userId)`
- Reconstrói o shape `CategoryProps[]` (categorias com produtos aninhados) a cada snapshot
- Gerencia cleanup dos listeners no `useEffect` return

---

## Diferenciação: mudança local vs. remota

Para exibir o toast apenas em mudanças de outros dispositivos:

```ts
const isLocalMutation = useRef(false)

// Chamado antes de cada mutation no contexto:
isLocalMutation.current = true

// Handler do onSnapshot:
if (isLocalMutation.current) {
  isLocalMutation.current = false
  return  // mudança própria — sem toast
}
// mudança remota → setCategories() + toast("Lista atualizada")
```

Não requer nenhum campo extra no Firestore.

---

## Firestore Security Rules

Necessárias para autorizar leituras do browser via client SDK. Writes permanecem bloqueados do client — o Admin SDK no servidor ignora essas rules.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /categories/{categoryId} {
      allow read: if request.auth != null
                  && request.auth.uid == resource.data.userId;
      allow write: if false;
    }

    match /products/{productId} {
      allow read: if request.auth != null
                  && request.auth.uid == resource.data.userId;
      allow write: if false;
    }

  }
}
```

Deploy via `firebase deploy --only firestore:rules` ou Firebase Console.
O Firebase Emulator (porta 8080) avalia as rules em desenvolvimento.

---

## UX: comportamento do toast

| Evento | Toast exibido |
|---|---|
| Produto adicionado por outro dispositivo | "Lista atualizada" |
| Produto editado por outro dispositivo | "Lista atualizada" |
| Produto removido por outro dispositivo | "Lista atualizada" |
| Categoria adicionada por outro dispositivo | "Lista atualizada" |
| Categoria removida por outro dispositivo | "Lista atualizada" |
| Mudança feita pelo próprio dispositivo | Nenhum toast |
| Carregamento inicial da lista | Nenhum toast |

O toast reutiliza o sistema de notificações já existente no projeto. Duração: ~3 segundos. Não-bloqueante.

---

## Tratamento de erros

| Cenário | Comportamento |
|---|---|
| Falha ao buscar custom token | Listener não é aberto; lista funciona via fetch inicial (degradação silenciosa) |
| Perda de conexão durante sessão | Firebase client SDK reconecta automaticamente e entrega mudanças acumuladas |
| Erro no listener `onSnapshot` | Log no console + listener fechado graciosamente; estado em memória preservado |
| Logout | `unsubscribe()` cancela listeners; `signOut(auth)` encerra sessão Firebase |

**Princípio:** real-time é uma melhoria progressiva. Falhas no sync não quebram a experiência básica.

---

## Novas variáveis de ambiente necessárias

```env
# Firebase client SDK (públicas — prefixo NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

As credenciais de Admin SDK (`AUTH_FIREBASE_*`) já existem no projeto.

---

## Arquivos impactados

| Arquivo | Tipo de mudança |
|---|---|
| `src/lib/firebase-client.ts` | Novo |
| `src/app/api/auth/firebase-token/route.ts` | Novo |
| `src/hooks/useFirebaseAuth.ts` | Novo |
| `src/context/CategoryContext.tsx` | Modificado (fetch → onSnapshot + isLocalMutation) |
| `src/context/ProductContext.tsx` | Modificado (expor helper isLocalMutation para mutations de produto) |
| `firestore.rules` | Modificado (adicionar rules de read para categories e products) |
| `.env.local` / `.env.example` | Modificado (novas variáveis NEXT_PUBLIC_) |
| `package.json` | Modificado (adicionar dependência `firebase` client SDK) |

---

## Alternativas avaliadas e descartadas

| Opção | Motivo do descarte |
|---|---|
| Polling (SWR/React Query com `refreshInterval`) | Não é real-time; consome API calls e Firestore reads mesmo sem mudanças |
| SSE via Edge Runtime | Alta complexidade; sem estado compartilhado entre instâncias serverless (problema de broadcast) |
