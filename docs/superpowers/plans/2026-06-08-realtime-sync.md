# Real-time Sync entre Dispositivos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que alterações feitas em um dispositivo sejam refletidas automaticamente em todos os outros dispositivos conectados à mesma conta, com toast "Lista atualizada" para mudanças remotas.

**Architecture:** O Firebase client SDK é adicionado ao browser para abrir listeners `onSnapshot` nas coleções `categories` e `products`. O `CategoriesContextProvider` gerencia o ciclo de vida dos listeners. Todas as escritas continuam passando pelas API routes existentes sem nenhuma mudança. Um novo endpoint `/api/auth/firebase-token` gera um custom token que autentica o cliente no Firebase para leituras.

**Tech Stack:** Firebase client SDK (`firebase`), Firebase Admin SDK (`firebase-admin` — já instalado), NextAuth.js, React Context API, Sonner (toasts — já instalado)

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/lib/firebase-client.ts` | Criar | Singleton do Firebase client app, auth e db |
| `src/app/api/auth/firebase-token/route.ts` | Criar | Endpoint que gera custom token Firebase |
| `src/hooks/useFirebaseAuth.ts` | Criar | Hook que autentica o cliente no Firebase |
| `src/context/CategoryContext.tsx` | Modificar | Substituir fetch por onSnapshot + isLocalMutationCount + markLocalMutation |
| `src/context/ProductContext.tsx` | Modificar | Chamar markLocalMutation() antes de cada mutation |
| `firebase.json` | Modificar | Adicionar Auth Emulator para desenvolvimento |
| `firestore.rules` | Criar | Security Rules para leituras client-side |
| `.env.local` | Modificar | Variáveis NEXT_PUBLIC_ + FIREBASE_AUTH_EMULATOR_HOST |

---

## Task 1: Instalar firebase client SDK e configurar ambiente

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`
- Modify: `firebase.json`

- [ ] **Step 1: Instalar firebase client SDK**

No diretório do worktree (`easy-list/.claude/worktrees/feat+realtime-sync`):

```bash
npm install firebase
```

Resultado esperado: `firebase` aparece em `dependencies` no `package.json`.

- [ ] **Step 2: Adicionar variáveis de ambiente ao `.env.local`**

Abra o Firebase Console → Project Settings → General → Your apps → Web app.
Adicione ao final do `.env.local` na raiz do projeto:

```env
# Firebase client SDK (público — usado no browser)
NEXT_PUBLIC_FIREBASE_API_KEY=<valor do console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<valor do console>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<valor do console>

# Auth Emulator — só necessário em desenvolvimento
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

> Em desenvolvimento com o emulator, os valores de `NEXT_PUBLIC_FIREBASE_*` podem ser quaisquer strings não-vazias (ex: `easy-list-local` para o project ID). O emulator não valida as credenciais.

- [ ] **Step 3: Adicionar Auth Emulator ao `firebase.json`**

Substitua o conteúdo de `firebase.json` por:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

- [ ] **Step 4: Verificar que o emulator sobe com auth**

```bash
npx firebase emulators:start
```

Resultado esperado: linhas como:
```
✔  firestore: Emulator started at http://127.0.0.1:8080
✔  auth: Emulator started at http://127.0.0.1:9099
✔  All emulators ready!
```

Pressione `Ctrl+C` para parar.

- [ ] **Step 5: Criar `.env.example` com as novas variáveis**

Crie o arquivo `.env.example` na raiz do projeto com o template das variáveis necessárias:

```env
# Firebase Admin SDK (server-only — não incluir no client bundle)
AUTH_FIREBASE_PROJECT_ID=
AUTH_FIREBASE_CLIENT_EMAIL=
AUTH_FIREBASE_PRIVATE_KEY=

# Firebase client SDK (público — prefixo NEXT_PUBLIC_ obrigatório)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Apenas em desenvolvimento — não definir em produção
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

- [ ] **Step 6: Commit**

```bash
git add firebase.json package.json package-lock.json .env.example
git commit -m "chore: install firebase client SDK and configure auth emulator"
```

---

## Task 2: Criar `src/lib/firebase-client.ts`

**Files:**
- Create: `src/lib/firebase-client.ts`

- [ ] **Step 1: Criar o arquivo**

Crie `src/lib/firebase-client.ts` com o seguinte conteúdo:

```ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length ? getApp() : initializeApp(clientConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

if (process.env.NODE_ENV === 'development') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch {
    // Emulators already connected (HMR re-execution)
  }
}
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

Resultado esperado: nenhum erro relacionado ao arquivo criado.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firebase-client.ts
git commit -m "feat: add firebase client SDK initialization"
```

---

## Task 3: Criar endpoint `GET /api/auth/firebase-token`

**Files:**
- Create: `src/app/api/auth/firebase-token/route.ts`

- [ ] **Step 1: Criar o arquivo**

Crie `src/app/api/auth/firebase-token/route.ts`:

```ts
import { getAuth } from 'firebase-admin/auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });
  const userId = token?.sub ?? null;

  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const firebaseToken = await getAuth().createCustomToken(userId);

    return NextResponse.json({ token: firebaseToken }, { status: 200 });
  } catch (error) {
    console.error('Failed to create Firebase custom token:', error);

    return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Testar o endpoint manualmente**

Com o emulator rodando (`npx firebase emulators:start`) e o Next.js rodando (`npm run dev`), abra o browser com sessão ativa e acesse no console do browser:

```js
const res = await fetch('/api/auth/firebase-token')
const data = await res.json()
console.log(data) // { token: "eyJ..." }
```

Resultado esperado: objeto com campo `token` (string JWT longa).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/firebase-token/route.ts
git commit -m "feat: add firebase custom token endpoint"
```

---

## Task 4: Criar hook `useFirebaseAuth`

**Files:**
- Create: `src/hooks/useFirebaseAuth.ts`

- [ ] **Step 1: Criar o arquivo**

Crie `src/hooks/useFirebaseAuth.ts`:

```ts
'use client';

import { signInWithCustomToken } from 'firebase/auth';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { auth } from '@/lib/firebase-client';
import { AuthStatusEnum } from '@/types/enums';

export function useFirebaseAuth() {
  const { status: sessionStatus } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (sessionStatus !== AuthStatusEnum.authenticated) return;

    let cancelled = false;

    async function authenticate() {
      try {
        const response = await fetch('/api/auth/firebase-token');

        if (!response.ok) return;

        const { token } = await response.json();

        await signInWithCustomToken(auth, token);

        if (!cancelled) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Firebase auth failed:', error);
      }
    }

    authenticate();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  return { isReady };
}
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Testar manualmente**

Com o emulator e Next.js rodando, adicione temporariamente no `CategoriesContextProvider` (só para teste):

```ts
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
// dentro do componente:
const { isReady } = useFirebaseAuth();
console.log('Firebase auth ready:', isReady);
```

Abra o browser, logue na aplicação. No console do browser você deve ver:
```
Firebase auth ready: false
Firebase auth ready: true
```

Remova o `console.log` após verificar.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useFirebaseAuth.ts
git commit -m "feat: add useFirebaseAuth hook for client-side Firebase authentication"
```

---

## Task 5: Adicionar `markLocalMutation` à interface e ao `CategoriesContextProvider`

**Files:**
- Modify: `src/context/CategoryContext.tsx`

Esta tarefa é incremental: adiciona somente a ref e o método ao contexto, sem tocar na lógica de fetch/snapshot ainda.

- [ ] **Step 1: Adicionar `markLocalMutation` à interface `CategoriesContextType`**

Em `src/context/CategoryContext.tsx`, localize a interface `CategoriesContextType` (linha 10) e adicione o campo:

```ts
interface CategoriesContextType {
  categories: CategoryProps[];
  selectedCategoryId?: string;
  isLoadingCategories: boolean;
  errorCategories: string | null;
  filteredCategory?: CategoryProps;
  fetchCategories: () => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  setSelectedCategoryId: (categoryId: string) => void;
  setCategories: React.Dispatch<React.SetStateAction<CategoryProps[]>>;
  addCategory: (category: CategoryProps) => Promise<void>;
  markLocalMutation: (count?: number) => void;
}
```

- [ ] **Step 2: Adicionar a ref e o callback dentro do `CategoriesContextProvider`**

Logo após as declarações de estado existentes (após a linha `const [filteredCategory, setFilteredCategory] = ...`), adicione:

```ts
const localMutationCount = useRef(0);

const markLocalMutation = useCallback((count = 1) => {
  localMutationCount.current += count;
}, []);
```

Lembre de adicionar `useRef` ao import do React se ainda não estiver:

```ts
import React, { useState, useEffect, useContext, useCallback, createContext, useRef } from 'react';
```

- [ ] **Step 3: Expor `markLocalMutation` no valor do contexto**

Localize o `<CategoriesContext.Provider value={{...}}>` e adicione `markLocalMutation`:

```ts
<CategoriesContext.Provider
  value={{
    categories,
    addCategory,
    setCategories,
    removeCategory,
    fetchCategories,
    errorCategories,
    filteredCategory,
    selectedCategoryId,
    isLoadingCategories,
    setSelectedCategoryId,
    markLocalMutation,
  }}
>
```

- [ ] **Step 4: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/context/CategoryContext.tsx
git commit -m "feat: expose markLocalMutation in CategoriesContext"
```

---

## Task 6: Substituir `fetchCategories` por `onSnapshot` no `CategoriesContextProvider`

**Files:**
- Modify: `src/context/CategoryContext.tsx`

Esta é a tarefa central. O arquivo `CategoryContext.tsx` será significativamente modificado. O conteúdo completo do arquivo após esta tarefa deve ser:

- [ ] **Step 1: Substituir o conteúdo de `src/context/CategoryContext.tsx`**

```tsx
'use client';

import { toast } from 'sonner';
import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect, useContext, useCallback, createContext, useRef } from 'react';

import { AuthStatusEnum } from '@/types/enums';
import { CategoryProps, ProductProps } from '@/types/interfaces';
import { auth, db } from '@/lib/firebase-client';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface RawCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface RawProduct {
  id: string;
  name: string;
  categoryId: string;
  price?: string;
  quantity?: string;
  unit?: string;
  addToCart?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesContextType {
  categories: CategoryProps[];
  selectedCategoryId?: string;
  isLoadingCategories: boolean;
  errorCategories: string | null;
  filteredCategory?: CategoryProps;
  fetchCategories: () => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  setSelectedCategoryId: (categoryId: string) => void;
  setCategories: React.Dispatch<React.SetStateAction<CategoryProps[]>>;
  addCategory: (category: CategoryProps) => Promise<void>;
  markLocalMutation: (count?: number) => void;
}

interface CategoryProviderProps {
  children: React.ReactNode;
}

export const CategoriesContext = createContext({} as CategoriesContextType);

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

function CategoriesContextProvider({ children }: CategoryProviderProps) {
  const { status: sessionStatus } = useSession();
  const { isReady } = useFirebaseAuth();

  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [filteredCategory, setFilteredCategory] = useState<CategoryProps | undefined>(undefined);

  const localMutationCount = useRef(0);
  const latestCategoriesRef = useRef<RawCategory[]>([]);
  const latestProductsRef = useRef<RawProduct[]>([]);
  const pendingInitialSnapshots = useRef(2);

  const markLocalMutation = useCallback((count = 1) => {
    localMutationCount.current += count;
  }, []);

  const buildCategoriesFromRefs = useCallback((): CategoryProps[] => {
    const cats = latestCategoriesRef.current;
    const prods = latestProductsRef.current;

    return cats
      .map((cat): CategoryProps => {
        const catRef: CategoryProps = {
          _id: cat.id,
          name: cat.name,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        };

        const products: ProductProps[] = prods
          .filter((p) => p.categoryId === cat.id)
          .map((p) => ({
            _id: p.id,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            unit: p.unit,
            categoryId: p.categoryId,
            addToCart: Boolean(p.addToCart),
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            category: catRef,
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

        return { ...catRef, products };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }, []);

  const handleSnapshotUpdate = useCallback(
    (isInitial: boolean) => {
      const rebuilt = buildCategoriesFromRefs();
      setCategories(rebuilt);

      if (pendingInitialSnapshots.current === 0) {
        setIsLoadingCategories(false);
      }

      if (isInitial) return;

      if (localMutationCount.current > 0) {
        localMutationCount.current -= 1;
        return;
      }

      toast('Lista atualizada');
    },
    [buildCategoriesFromRefs]
  );

  useEffect(() => {
    if (!isReady || sessionStatus !== AuthStatusEnum.authenticated) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    pendingInitialSnapshots.current = 2;

    const categoriesQuery = query(
      collection(db, 'categories'),
      where('userId', '==', userId)
    );

    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', userId)
    );

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const isInitial = pendingInitialSnapshots.current > 0;
        if (isInitial) pendingInitialSnapshots.current -= 1;

        latestCategoriesRef.current = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          };
        });

        handleSnapshotUpdate(isInitial);
      },
      (error) => {
        console.error('Categories listener error:', error);
        setErrorCategories(error.message);
      }
    );

    const unsubProducts = onSnapshot(
      productsQuery,
      (snapshot) => {
        const isInitial = pendingInitialSnapshots.current > 0;
        if (isInitial) pendingInitialSnapshots.current -= 1;

        latestProductsRef.current = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            categoryId: data.categoryId as string,
            price: data.price as string | undefined,
            quantity: data.quantity as string | undefined,
            unit: data.unit as string | undefined,
            addToCart: data.addToCart as boolean | undefined,
            createdAt: timestampToIso(data.createdAt),
            updatedAt: timestampToIso(data.updatedAt),
          };
        });

        handleSnapshotUpdate(isInitial);
      },
      (error) => {
        console.error('Products listener error:', error);
        setErrorCategories(error.message);
      }
    );

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, [isReady, sessionStatus, handleSnapshotUpdate]);

  const addCategory = async (category: CategoryProps) => {
    markLocalMutation();

    const response = await fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      localMutationCount.current -= 1;
      toast('Erro ao criar categoria');
      throw new Error('Failed to create category');
    }

    toast('Categoria criada com sucesso');
  };

  const removeCategory = async (id: string) => {
    const productCount = categories.find((c) => c._id === id)?.products?.length ?? 0;
    markLocalMutation(1 + productCount);

    const response = await fetch(`/api/categories?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      localMutationCount.current -= (1 + productCount);
      toast('Erro ao remover categoria');
      return;
    }

    if (response.status === 204) {
      toast('Categoria removida com sucesso');
    }
  };

  const fetchCategories = useCallback(async () => {
    // No-op: initial load is handled by onSnapshot
  }, []);

  const filterCategory = useCallback(
    (categoryId: string) => {
      if (!categoryId || categoryId === 'all') {
        setFilteredCategory(undefined);
        return;
      }
      const found = categories.find((category) => category?._id === categoryId);
      setFilteredCategory(found);
    },
    [categories]
  );

  useEffect(() => {
    if (filteredCategory) {
      filterCategory(filteredCategory._id);
    }
  }, [categories, filterCategory, filteredCategory]);

  useEffect(() => {
    if (
      sessionStatus === AuthStatusEnum.loading ||
      sessionStatus === AuthStatusEnum.unauthenticated
    ) {
      return;
    }

    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find((c) => c._id === selectedCategoryId);

      if (!category) {
        toast('Categoria não encontrada');
        return;
      }

      setFilteredCategory(category);
    }
  }, [selectedCategoryId, categories, sessionStatus]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        setCategories,
        removeCategory,
        fetchCategories,
        errorCategories,
        filteredCategory,
        selectedCategoryId,
        isLoadingCategories,
        setSelectedCategoryId,
        markLocalMutation,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

function useCategories(): CategoriesContextType {
  const context = useContext(CategoriesContext);

  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}

export { useCategories, CategoriesContextProvider };
```

- [ ] **Step 2: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Resultado esperado: zero erros.

- [ ] **Step 3: Verificar lint**

```bash
npm run lint
```

Resultado esperado: zero erros.

- [ ] **Step 4: Testar carregamento inicial**

Com emulators e Next.js rodando, logue na aplicação. A lista de categorias deve aparecer normalmente (mesmos dados de antes). O loading spinner deve sumir após o carregamento.

- [ ] **Step 5: Commit**

```bash
git add src/context/CategoryContext.tsx
git commit -m "feat: replace fetchCategories with Firestore onSnapshot real-time listeners"
```

---

## Task 7: Chamar `markLocalMutation()` nas mutations do `ProductContext`

**Files:**
- Modify: `src/context/ProductContext.tsx`

As mutations de produto precisam sinalizar ao listener que a próxima snapshot é local, evitando o toast "Lista atualizada" no próprio dispositivo.

- [ ] **Step 1: Adicionar `markLocalMutation` ao destructuring de `useCategories()`**

Localize a linha (linha 43):

```ts
const { categories, setCategories, selectedCategoryId } = useCategories();
```

Substitua por:

```ts
const { categories, setCategories, selectedCategoryId, markLocalMutation } = useCategories();
```

- [ ] **Step 2: Adicionar `markLocalMutation()` em `managerProduct` (criar produto)**

Localize o trecho que cria produto (sem `product._id`), linha ~148:

```ts
} else {
  const response = await fetch('/api/products', {
```

Adicione a chamada antes do fetch:

```ts
} else {
  markLocalMutation();
  const response = await fetch('/api/products', {
```

- [ ] **Step 3: Adicionar `markLocalMutation()` em `managerProduct` (atualizar produto)**

Localize o trecho que atualiza produto (com `product._id`), linha ~99:

```ts
if (product._id) {
  const response = await fetch(`/api/products/${product._id}`, {
    method: 'PUT',
```

Adicione antes do fetch:

```ts
if (product._id) {
  markLocalMutation();
  const response = await fetch(`/api/products/${product._id}`, {
    method: 'PUT',
```

- [ ] **Step 4: Adicionar `markLocalMutation()` em `removeProduct`**

Localize a função `removeProduct` (linha ~180):

```ts
const removeProduct = async (id: string) => {
  try {
    setIsProductLoading({ productId: id, isLoading: true });

    const response = await fetch(`/api/products/${id}`, {
```

Adicione após `setIsProductLoading`:

```ts
const removeProduct = async (id: string) => {
  try {
    setIsProductLoading({ productId: id, isLoading: true });
    markLocalMutation();

    const response = await fetch(`/api/products/${id}`, {
```

- [ ] **Step 5: Adicionar `markLocalMutation()` em `removeAllProducts`**

Localize a função `removeAllProducts` (linha ~212):

```ts
const removeAllProducts = async () => {
  try {
    await Promise.all(categories.flatMap(category => category.products || []).map(product =>
      fetch(`/api/products/${product._id}`, { method: 'DELETE' })
    ));
```

Substitua por:

```ts
const removeAllProducts = async () => {
  try {
    const allProducts = categories.flatMap((category) => category.products || []);
    markLocalMutation(allProducts.length);

    await Promise.all(
      allProducts.map((product) =>
        fetch(`/api/products/${product._id}`, { method: 'DELETE' })
      )
    );
```

- [ ] **Step 6: Adicionar `markLocalMutation()` em `toggleCart`**

Localize a função `toggleCart` (linha ~228), logo após `setIsProductLoading`:

```ts
const toggleCart = async (id: string) => {
  if (!id) return;

  setIsProductLoading({ productId: id, isLoading: true });

  try {
    const product = categories.flatMap(...)
```

Adicione após `setIsProductLoading`:

```ts
const toggleCart = async (id: string) => {
  if (!id) return;

  setIsProductLoading({ productId: id, isLoading: true });
  markLocalMutation();

  try {
    const product = categories.flatMap(...)
```

- [ ] **Step 7: Verificar TypeScript e lint**

```bash
npx tsc --noEmit && npm run lint
```

Resultado esperado: zero erros.

- [ ] **Step 8: Commit**

```bash
git add src/context/ProductContext.tsx
git commit -m "feat: call markLocalMutation before each product mutation to suppress local-change toasts"
```

---

## Task 8: Criar Firestore Security Rules

**Files:**
- Create: `firestore.rules`

As Security Rules autorizam leituras client-side pelo Firebase client SDK. Writes do servidor via Admin SDK ignoram estas rules.

- [ ] **Step 1: Criar `firestore.rules` na raiz do projeto**

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

- [ ] **Step 2: Referenciar o arquivo no `firebase.json`**

Atualize `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

- [ ] **Step 3: Verificar que o emulator carrega as rules**

```bash
npx firebase emulators:start
```

Resultado esperado: linha contendo `Rules updated`.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules firebase.json
git commit -m "feat: add Firestore security rules for client-side reads"
```

---

## Task 9: Verificação manual — sync em tempo real

**Pré-requisitos:** Firebase emulators rodando (`npx firebase emulators:start`) e Next.js rodando (`npm run dev`) em terminais separados.

- [ ] **Step 1: Logar na aplicação em duas abas do mesmo browser**

Abra `http://localhost:3000` em duas abas. Logue com a mesma conta nas duas abas. Ambas devem mostrar a mesma lista.

- [ ] **Step 2: Verificar que os listeners estão ativos**

No console do browser da Aba 1, execute:

```js
// Deve retornar o usuário Firebase autenticado (não null)
firebase.auth().currentUser
// Ou verifique via:
import('/api/auth/firebase-token').then(...)
```

Alternativamente, verifique o Firebase Emulator UI em `http://localhost:4000` — deve mostrar um usuário autenticado em Authentication.

- [ ] **Step 3: Testar adição de produto**

Na Aba 1: adicione um produto em qualquer categoria.

Resultado esperado:
- Aba 1: produto aparece na lista **sem** toast "Lista atualizada" (é mudança local)
- Aba 2: produto aparece na lista **com** toast "Lista atualizada" (é mudança remota)

- [ ] **Step 4: Testar edição de produto**

Na Aba 2: edite o nome do produto recém-criado.

Resultado esperado:
- Aba 2: sem toast
- Aba 1: toast "Lista atualizada", nome do produto atualizado

- [ ] **Step 5: Testar remoção de produto**

Na Aba 1: remova o produto.

Resultado esperado:
- Aba 1: sem toast, produto desaparece da lista
- Aba 2: toast "Lista atualizada", produto desaparece da lista

- [ ] **Step 6: Testar adição de categoria**

Na Aba 2: adicione uma nova categoria.

Resultado esperado:
- Aba 2: categoria aparece sem toast
- Aba 1: toast "Lista atualizada", nova categoria visível

- [ ] **Step 7: Testar toggle do carrinho**

Na Aba 1: marque um produto para o carrinho.

Resultado esperado:
- Aba 1: sem toast
- Aba 2: toast "Lista atualizada", produto marcado no carrinho

- [ ] **Step 8: Commit final**

```bash
git add .
git commit -m "chore: complete realtime sync implementation and verification"
```

---

## Notas para produção

Antes de fazer deploy em produção:

1. **Deploy das Security Rules:** `npx firebase deploy --only firestore:rules`
2. **Variáveis de ambiente no Vercel:** adicionar `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (sem `FIREBASE_AUTH_EMULATOR_HOST`)
3. **Service account:** confirmar que `AUTH_FIREBASE_CLIENT_EMAIL` e `AUTH_FIREBASE_PRIVATE_KEY` estão configurados no Vercel (necessários para `createCustomToken` em produção)
