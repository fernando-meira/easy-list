# Firebase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MongoDB/Mongoose persistence with Firebase Firestore while preserving NextAuth Google, magic link, verification-code login, and Resend email delivery.

**Architecture:** Keep the existing client/API boundary. Client contexts continue calling `/api/categories`, `/api/products`, and auth routes. Server routes use Firebase Admin SDK and Firestore; NextAuth uses `FirestoreAdapter`; response mappers preserve the current Mongo-style `_id` API shape.

**Tech Stack:** Next.js 15 App Router, NextAuth v4, Auth.js Firebase adapter, Firebase Admin SDK, Firestore Emulator Suite, Resend, TypeScript, Zod.

---

## File Structure

- Create `src/lib/firebase-admin.ts`: server-only Firebase Admin singleton, Firestore export, emulator support, private-key normalization.
- Create `src/lib/firestore-auth-users.ts`: focused helpers to upsert/find NextAuth-compatible users for the custom credentials and magic-link flows.
- Create `src/lib/firestore-verification-codes.ts`: focused helpers for code/token records, rate limiting, attempt increments, and mark-used behavior.
- Create `src/lib/firestore-domain.ts`: focused helpers for categories/products, ownership validation, timestamp serialization, and response normalization.
- Modify `src/lib/auth.ts`: replace `MongoDBAdapter` and direct MongoDB calls with `FirestoreAdapter` and Firestore helpers.
- Modify `src/app/api/categories/route.ts`: replace Mongoose category/product logic with Firestore domain helpers.
- Modify `src/app/api/products/route.ts`: replace Mongoose product creation/listing with Firestore domain helpers and user ownership.
- Modify `src/app/api/products/[id]/route.ts`: replace Mongoose product read/update/delete with Firestore domain helpers and user ownership.
- Modify `src/app/api/auth/request-code/route.ts`: persist verification codes in Firestore and preserve Resend rollback behavior.
- Modify `src/app/api/auth/verify-code/route.ts`: validate codes and upsert auth user through Firestore helpers.
- Modify `src/app/api/auth/send-login/route.ts`: persist code/token records in Firestore and preserve Resend rollback behavior.
- Modify `src/app/api/auth/callback/email/route.ts`: validate magic-link token from Firestore and issue a JWT session cookie instead of writing a database session.
- Modify `src/lib/mongo-error.ts`: replace or remove Mongo-specific error messaging after all imports are gone.
- Delete `src/lib/mongodb.ts`, `src/lib/mongodb-adapter.ts`, `src/models/Category.ts`, `src/models/Product.ts` after all references are removed.
- Modify `package.json` and `package-lock.json`: add Firebase packages and remove MongoDB/Mongoose packages.
- Modify `README.md`: replace MongoDB setup notes with Firebase/Firestore/Emulator setup notes.

## Task 1: Dependencies And Firebase Admin Module

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/firebase-admin.ts`

- [ ] **Step 1: Install Firebase dependencies and remove Mongo packages**

Run:

```bash
npm install firebase-admin @auth/firebase-adapter && npm uninstall mongoose @types/mongoose @auth/mongodb-adapter
```

Expected: `package.json` and `package-lock.json` update. `package.json` includes `firebase-admin` and `@auth/firebase-adapter`; it no longer includes `mongoose`, `@types/mongoose`, or `@auth/mongodb-adapter`.

- [ ] **Step 2: Add Firebase Admin singleton**

Create `src/lib/firebase-admin.ts`:

```ts
import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.AUTH_FIREBASE_PROJECT_ID;
const clientEmail = process.env.AUTH_FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId) {
  throw new Error('Please define AUTH_FIREBASE_PROJECT_ID inside .env.local');
}

if (!process.env.FIRESTORE_EMULATOR_HOST && (!clientEmail || !privateKey)) {
  throw new Error('Please define AUTH_FIREBASE_CLIENT_EMAIL and AUTH_FIREBASE_PRIVATE_KEY inside .env.local');
}

const app = getApps()[0] ?? initializeApp(
  process.env.FIRESTORE_EMULATOR_HOST
    ? { projectId }
    : {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    }
);

export const firestore = getFirestore(app);
```

- [ ] **Step 3: Run typecheck for the new module**

Run:

```bash
npx tsc --noEmit
```

Expected: failures are allowed only from later MongoDB references after packages are removed. There must be no TypeScript error inside `src/lib/firebase-admin.ts`.

- [ ] **Step 4: Commit dependency and Firebase Admin setup**

Run:

```bash
git add package.json package-lock.json src/lib/firebase-admin.ts
git commit -m "feat: add Firebase Admin setup"
```

Expected: commit succeeds. If Husky runs `npm run lint:fix`, keep any formatting changes limited to staged files.

## Task 2: Firestore Auth User And Verification Helpers

**Files:**
- Create: `src/lib/firestore-auth-users.ts`
- Create: `src/lib/firestore-verification-codes.ts`

- [ ] **Step 1: Add auth-user helpers**

Create `src/lib/firestore-auth-users.ts`:

```ts
import 'server-only';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { firestore } from './firebase-admin';

interface AuthUserRecord {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
}

const usersCollection = firestore.collection('users');

function toAuthUser(id: string, data: FirebaseFirestore.DocumentData): AuthUserRecord {
  const emailVerified = data.emailVerified instanceof Timestamp
    ? data.emailVerified.toDate()
    : data.emailVerified ?? null;

  return {
    id,
    email: data.email,
    name: data.name ?? null,
    image: data.image ?? null,
    emailVerified,
  };
}

export async function findAuthUserByEmail(email: string) {
  const snapshot = await usersCollection.where('email', '==', email).limit(1).get();
  const doc = snapshot.docs[0];

  if (!doc) {
    return null;
  }

  return toAuthUser(doc.id, doc.data());
}

export async function upsertAuthUserByEmail(email: string) {
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    await usersCollection.doc(existingUser.id).set({
      emailVerified: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      ...existingUser,
      emailVerified: new Date(),
    };
  }

  const userRef = usersCollection.doc();

  await userRef.set({
    email,
    name: null,
    image: null,
    emailVerified: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    id: userRef.id,
    email,
    name: null,
    image: null,
    emailVerified: new Date(),
  };
}
```

- [ ] **Step 2: Add verification-code helpers**

Create `src/lib/firestore-verification-codes.ts`:

```ts
import 'server-only';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { firestore } from './firebase-admin';

interface CreateVerificationRecordInput {
  email: string;
  code?: string;
  token?: string;
  expiresAt: Date;
}

interface VerificationRecord {
  id: string;
  email: string;
  code?: string;
  token?: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
}

const verificationCodesCollection = firestore.collection('verificationCodes');

function toVerificationRecord(
  id: string,
  data: FirebaseFirestore.DocumentData
): VerificationRecord {
  return {
    id,
    email: data.email,
    code: data.code,
    token: data.token,
    expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : data.expiresAt,
    used: Boolean(data.used),
    attempts: Number(data.attempts ?? 0),
  };
}

export async function countRecentVerificationAttempts(email: string, since: Date) {
  const snapshot = await verificationCodesCollection
    .where('email', '==', email)
    .where('createdAt', '>=', Timestamp.fromDate(since))
    .get();

  return snapshot.size;
}

export async function createVerificationRecord(input: CreateVerificationRecordInput) {
  const recordRef = verificationCodesCollection.doc();

  await recordRef.set({
    email: input.email,
    code: input.code ?? null,
    token: input.token ?? null,
    expiresAt: Timestamp.fromDate(input.expiresAt),
    createdAt: FieldValue.serverTimestamp(),
    used: false,
    attempts: 0,
  });

  return recordRef.id;
}

export async function deleteVerificationRecord(recordId: string) {
  await verificationCodesCollection.doc(recordId).delete();
}

export async function findVerificationRecordByCode(email: string, code: string) {
  const snapshot = await verificationCodesCollection
    .where('email', '==', email)
    .where('code', '==', code)
    .limit(1)
    .get();

  const doc = snapshot.docs[0];

  return doc ? toVerificationRecord(doc.id, doc.data()) : null;
}

export async function findVerificationRecordByToken(email: string, token: string) {
  const snapshot = await verificationCodesCollection
    .where('email', '==', email)
    .where('token', '==', token)
    .limit(1)
    .get();

  const doc = snapshot.docs[0];

  return doc ? toVerificationRecord(doc.id, doc.data()) : null;
}

export function isVerificationRecordUsable(record: VerificationRecord) {
  return !record.used && record.expiresAt > new Date() && record.attempts < 5;
}

export async function incrementVerificationAttempts(recordId: string) {
  await verificationCodesCollection.doc(recordId).update({
    attempts: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function markVerificationRecordUsed(recordId: string) {
  await verificationCodesCollection.doc(recordId).update({
    used: true,
    usedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
```

- [ ] **Step 3: Run typecheck for helper modules**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors in `src/lib/firestore-auth-users.ts` or `src/lib/firestore-verification-codes.ts`. MongoDB import errors elsewhere can remain until later tasks remove those imports.

- [ ] **Step 4: Commit auth helper modules**

Run:

```bash
git add src/lib/firestore-auth-users.ts src/lib/firestore-verification-codes.ts
git commit -m "feat: add Firestore auth helpers"
```

Expected: commit succeeds.

## Task 3: Firestore Domain Helper

**Files:**
- Create: `src/lib/firestore-domain.ts`

- [ ] **Step 1: Add category and product domain helper**

Create `src/lib/firestore-domain.ts`:

```ts
import 'server-only';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { CategoryProps, ProductProps } from '@/types/interfaces';

import { firestore } from './firebase-admin';

type ProductWrite = Omit<ProductProps, '_id' | 'category' | 'createdAt' | 'updatedAt'> & {
  categoryId: string;
};

const categoriesCollection = firestore.collection('categories');
const productsCollection = firestore.collection('products');

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date().toISOString();
}

function categoryFromDoc(doc: FirebaseFirestore.DocumentSnapshot): CategoryProps {
  const data = doc.data();

  if (!data) {
    throw new Error('Categoria não encontrada');
  }

  return {
    _id: doc.id,
    name: data.name,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function productFromDoc(
  doc: FirebaseFirestore.DocumentSnapshot,
  category: CategoryProps
): ProductProps {
  const data = doc.data();

  if (!data) {
    throw new Error('Produto não encontrado');
  }

  return {
    _id: doc.id,
    name: data.name,
    price: data.price,
    quantity: data.quantity,
    unit: data.unit,
    categoryId: data.categoryId,
    addToCart: Boolean(data.addToCart),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    category,
  };
}

async function getOwnedCategory(categoryId: string, userId: string) {
  const categoryDoc = await categoriesCollection.doc(categoryId).get();

  if (!categoryDoc.exists || categoryDoc.data()?.userId !== userId) {
    return null;
  }

  return categoryFromDoc(categoryDoc);
}

async function getOwnedProductDoc(productId: string, userId: string) {
  const productDoc = await productsCollection.doc(productId).get();

  if (!productDoc.exists || productDoc.data()?.userId !== userId) {
    return null;
  }

  return productDoc;
}

export async function getCategoriesWithProducts(userId: string) {
  let categoriesSnapshot = await categoriesCollection.where('userId', '==', userId).get();

  if (categoriesSnapshot.empty) {
    await createCategory(userId, 'Supermercado');
    categoriesSnapshot = await categoriesCollection.where('userId', '==', userId).get();
  }

  const categories = categoriesSnapshot.docs.map(categoryFromDoc);
  const productsSnapshot = await productsCollection.where('userId', '==', userId).get();
  const productsByCategory = new Map<string, ProductProps[]>();

  for (const productDoc of productsSnapshot.docs) {
    const productData = productDoc.data();
    const category = categories.find((item) => item._id === productData.categoryId);

    if (!category) {
      continue;
    }

    const products = productsByCategory.get(category._id) ?? [];
    products.push(productFromDoc(productDoc, category));
    productsByCategory.set(category._id, products);
  }

  return categories.map((category) => ({
    ...category,
    products: productsByCategory.get(category._id) ?? [],
  }));
}

export async function getCategoryWithProducts(userId: string, categoryId: string) {
  const category = await getOwnedCategory(categoryId, userId);

  if (!category) {
    return null;
  }

  const productsSnapshot = await productsCollection
    .where('userId', '==', userId)
    .where('categoryId', '==', categoryId)
    .get();

  return {
    ...category,
    products: productsSnapshot.docs.map((productDoc) => productFromDoc(productDoc, category)),
  };
}

export async function createCategory(userId: string, name: string) {
  const categoryRef = categoriesCollection.doc();

  await categoryRef.set({
    name,
    userId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const categoryDoc = await categoryRef.get();

  return categoryFromDoc(categoryDoc);
}

export async function deleteCategory(userId: string, categoryId: string) {
  const category = await getOwnedCategory(categoryId, userId);

  if (!category) {
    return false;
  }

  const productsSnapshot = await productsCollection
    .where('userId', '==', userId)
    .where('categoryId', '==', categoryId)
    .get();

  const batch = firestore.batch();

  for (const productDoc of productsSnapshot.docs) {
    batch.delete(productDoc.ref);
  }

  batch.delete(categoriesCollection.doc(categoryId));
  await batch.commit();

  return true;
}

export async function getProducts(userId: string) {
  const productsSnapshot = await productsCollection.where('userId', '==', userId).get();
  const categoriesSnapshot = await categoriesCollection.where('userId', '==', userId).get();
  const categories = categoriesSnapshot.docs.map(categoryFromDoc);

  return productsSnapshot.docs.flatMap((productDoc) => {
    const category = categories.find((item) => item._id === productDoc.data().categoryId);

    return category ? [productFromDoc(productDoc, category)] : [];
  });
}

export async function createProduct(userId: string, product: ProductWrite) {
  const category = await getOwnedCategory(product.categoryId, userId);

  if (!category) {
    return null;
  }

  const productRef = productsCollection.doc();

  await productRef.set({
    name: product.name,
    price: product.price ?? null,
    quantity: product.quantity ?? null,
    unit: product.unit ?? null,
    categoryId: product.categoryId,
    userId,
    addToCart: Boolean(product.addToCart),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const productDoc = await productRef.get();

  return productFromDoc(productDoc, category);
}

export async function getProduct(userId: string, productId: string) {
  const productDoc = await getOwnedProductDoc(productId, userId);

  if (!productDoc) {
    return null;
  }

  const category = await getOwnedCategory(productDoc.data()?.categoryId, userId);

  if (!category) {
    return null;
  }

  return productFromDoc(productDoc, category);
}

export async function updateProduct(userId: string, productId: string, product: ProductWrite) {
  const productDoc = await getOwnedProductDoc(productId, userId);

  if (!productDoc) {
    return null;
  }

  const category = await getOwnedCategory(product.categoryId, userId);

  if (!category) {
    return null;
  }

  await productsCollection.doc(productId).update({
    name: product.name,
    price: product.price ?? null,
    quantity: product.quantity ?? null,
    unit: product.unit ?? null,
    categoryId: product.categoryId,
    addToCart: Boolean(product.addToCart),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updatedProductDoc = await productsCollection.doc(productId).get();

  return productFromDoc(updatedProductDoc, category);
}

export async function deleteProduct(userId: string, productId: string) {
  const productDoc = await getOwnedProductDoc(productId, userId);

  if (!productDoc) {
    return false;
  }

  await productDoc.ref.delete();

  return true;
}
```

- [ ] **Step 2: Run typecheck for domain helper**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors in `src/lib/firestore-domain.ts`.

- [ ] **Step 3: Commit domain helper**

Run:

```bash
git add src/lib/firestore-domain.ts
git commit -m "feat: add Firestore domain helpers"
```

Expected: commit succeeds.

## Task 4: Replace Category API With Firestore

**Files:**
- Modify: `src/app/api/categories/route.ts`

- [ ] **Step 1: Replace category route implementation**

Replace `src/app/api/categories/route.ts` with:

```ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import {
  createCategory,
  deleteCategory,
  getCategoryWithProducts,
  getCategoriesWithProducts,
} from '@/lib/firestore-domain';

interface CategoryData {
  name: string;
}

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });

  return token?.sub ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const categoryId = url.searchParams.get('id');

    if (categoryId) {
      const category = await getCategoryWithProducts(userId, categoryId);

      if (!category) {
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
      }

      return NextResponse.json(category, { status: 200 });
    }

    const categories = await getCategoriesWithProducts(userId);

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data: CategoryData = await request.json();

    if (!data.name) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const category = await createCategory(userId, data.name);

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    const wasDeleted = await deleteCategory(userId, id);

    if (!wasDeleted) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Run lint for the category route**

Run:

```bash
npm run lint
```

Expected: no ESLint errors from `src/app/api/categories/route.ts`.

- [ ] **Step 3: Commit category API migration**

Run:

```bash
git add src/app/api/categories/route.ts
git commit -m "feat: migrate category API to Firestore"
```

Expected: commit succeeds.

## Task 5: Replace Product APIs With Firestore

**Files:**
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/products/[id]/route.ts`

- [ ] **Step 1: Replace products collection route**

Replace `src/app/api/products/route.ts` with:

```ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { createProduct, getProducts } from '@/lib/firestore-domain';

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });

  return token?.sub ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const products = await getProducts(userId);

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const product = await createProduct(userId, data);

    if (!product) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace product detail route**

Replace `src/app/api/products/[id]/route.ts` with:

```ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { deleteProduct, getProduct, updateProduct } from '@/lib/firestore-domain';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret });

  return token?.sub ?? null;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const data = await request.json();
    const product = await updateProduct(userId, id, data);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const product = await getProduct(userId, id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Error getting product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const wasDeleted = await deleteProduct(userId, id);

    if (!wasDeleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run lint for product routes**

Run:

```bash
npm run lint
```

Expected: no ESLint errors from product routes.

- [ ] **Step 4: Commit product API migration**

Run:

```bash
git add src/app/api/products/route.ts src/app/api/products/[id]/route.ts
git commit -m "feat: migrate product APIs to Firestore"
```

Expected: commit succeeds.

## Task 6: Replace NextAuth Adapter And Credentials Flow

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Replace Mongo adapter and credentials MongoDB access**

Modify `src/lib/auth.ts` imports:

```ts
import { Resend } from 'resend';
import { AuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { FirestoreAdapter } from '@auth/firebase-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cert } from 'firebase-admin/app';
```

Add these imports below local imports:

```ts
import { authSecret } from './auth-secret';
import { upsertAuthUserByEmail } from './firestore-auth-users';
import {
  findVerificationRecordByCode,
  isVerificationRecordUsable,
  incrementVerificationAttempts,
  markVerificationRecordUsed,
} from './firestore-verification-codes';
```

Add this adapter credential helper above `authOptions`:

```ts
const firebaseAdapterCredential = cert({
  projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
  clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
});
```

Replace the adapter entry:

```ts
adapter: FirestoreAdapter({
  credential: firebaseAdapterCredential,
}),
```

Replace `CredentialsProvider.authorize` with:

```ts
async authorize(credentials) {
  if (!credentials?.email || !credentials?.code) {
    return null;
  }

  try {
    const verificationCode = await findVerificationRecordByCode(
      credentials.email,
      credentials.code
    );

    if (!verificationCode) {
      return null;
    }

    if (!isVerificationRecordUsable(verificationCode)) {
      await incrementVerificationAttempts(verificationCode.id);
      return null;
    }

    const user = await upsertAuthUserByEmail(credentials.email);
    await markVerificationRecordUsed(verificationCode.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('Erro ao autenticar com código:', error);
    return null;
  }
}
```

- [ ] **Step 2: Run typecheck for auth options**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors in `src/lib/auth.ts`. If `FirestoreAdapter` complains about credential typing, adjust only the adapter credential expression to the exact type expected by `@auth/firebase-adapter` while keeping the same environment variables.

- [ ] **Step 3: Commit NextAuth migration**

Run:

```bash
git add src/lib/auth.ts
git commit -m "feat: migrate NextAuth storage to Firestore"
```

Expected: commit succeeds.

## Task 7: Replace Verification Code Routes

**Files:**
- Modify: `src/app/api/auth/request-code/route.ts`
- Modify: `src/app/api/auth/verify-code/route.ts`

- [ ] **Step 1: Replace request-code persistence**

In `src/app/api/auth/request-code/route.ts`, remove `clientPromise` import and add:

```ts
import {
  createVerificationRecord,
  deleteVerificationRecord,
  countRecentVerificationAttempts,
} from '@/lib/firestore-verification-codes';
```

Replace the MongoDB recent-attempts block with:

```ts
const recentAttempts = await countRecentVerificationAttempts(
  email,
  new Date(Date.now() - 60 * 60 * 1000)
);
```

Replace the insert block with:

```ts
const verificationRecordId = await createVerificationRecord({
  email,
  code: verificationCode,
  expiresAt,
});
```

Replace the email-failure rollback block with:

```ts
await deleteVerificationRecord(verificationRecordId);
```

- [ ] **Step 2: Replace verify-code persistence**

Replace `src/app/api/auth/verify-code/route.ts` with:

```ts
import { z } from 'zod';
import { NextResponse } from 'next/server';

import { upsertAuthUserByEmail } from '@/lib/firestore-auth-users';
import {
  findVerificationRecordByCode,
  isVerificationRecordUsable,
  incrementVerificationAttempts,
} from '@/lib/firestore-verification-codes';

const verifyCodeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(4, 'Código deve ter 4 caracteres'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = verifyCodeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { email, code } = result.data;
    const verificationCode = await findVerificationRecordByCode(email, code);

    if (!verificationCode) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    if (!isVerificationRecordUsable(verificationCode)) {
      await incrementVerificationAttempts(verificationCode.id);

      if (verificationCode.used) {
        return NextResponse.json({ error: 'Código já utilizado' }, { status: 400 });
      }

      if (verificationCode.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Código expirado' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Número máximo de tentativas excedido' }, { status: 400 });
    }

    await upsertAuthUserByEmail(email);

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Erro ao verificar código:', error);

    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run lint and typecheck for verification routes**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: no errors in `request-code` or `verify-code` routes.

- [ ] **Step 4: Commit verification route migration**

Run:

```bash
git add src/app/api/auth/request-code/route.ts src/app/api/auth/verify-code/route.ts
git commit -m "feat: migrate verification code routes to Firestore"
```

Expected: commit succeeds.

## Task 8: Replace Combined Login Email And Magic Link Callback

**Files:**
- Modify: `src/app/api/auth/send-login/route.ts`
- Modify: `src/app/api/auth/callback/email/route.ts`

- [ ] **Step 1: Replace send-login persistence and error helper**

In `src/app/api/auth/send-login/route.ts`, remove these imports:

```ts
import { clientPromise } from '@/lib/mongodb-adapter';
import { getMongoUserFacingError } from '@/lib/mongo-error';
```

Add:

```ts
import {
  createVerificationRecord,
  deleteVerificationRecord,
  countRecentVerificationAttempts,
} from '@/lib/firestore-verification-codes';
```

Replace recent-attempts, insert, rollback, and final catch behavior with:

```ts
const recentAttempts = await countRecentVerificationAttempts(
  email,
  new Date(Date.now() - 60 * 60 * 1000)
);

if (recentAttempts >= 5) {
  return NextResponse.json(
    { error: 'Muitas tentativas. Por favor, tente novamente mais tarde.' },
    { status: 429 }
  );
}

const verificationRecordId = await createVerificationRecord({
  email,
  code: verificationCode,
  token: magicLinkToken,
  expiresAt,
});
```

In the Resend failure catch, replace the Mongo delete with:

```ts
await deleteVerificationRecord(verificationRecordId);
```

In the outer catch, return:

```ts
return NextResponse.json(
  { error: 'Erro ao processar solicitação de login' },
  { status: 500 }
);
```

- [ ] **Step 2: Replace magic-link callback route**

Replace `src/app/api/auth/callback/email/route.ts` with:

```ts
import { encode } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

import { authSecret } from '@/lib/auth-secret';
import { upsertAuthUserByEmail } from '@/lib/firestore-auth-users';
import {
  findVerificationRecordByToken,
  isVerificationRecordUsable,
  markVerificationRecordUsed,
} from '@/lib/firestore-verification-codes';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
    }

    const decodedEmail = decodeURIComponent(email);
    const verificationRecord = await findVerificationRecordByToken(decodedEmail, token);

    if (!verificationRecord || !isVerificationRecordUsable(verificationRecord)) {
      return NextResponse.redirect(new URL('/login?error=ExpiredToken', request.url));
    }

    const user = await upsertAuthUserByEmail(decodedEmail);
    await markVerificationRecordUsed(verificationRecord.id);

    const sessionToken = await encode({
      secret: authSecret,
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.image,
      },
      maxAge: 30 * 24 * 60 * 60,
    });

    const response = NextResponse.redirect(new URL('/', request.url));

    response.cookies.set('next-auth.session-token', sessionToken, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no callback do magic link:', error);

    return NextResponse.redirect(new URL('/login?error=CallbackError', request.url));
  }
}
```

- [ ] **Step 3: Run typecheck for login routes**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors in `send-login` or `callback/email`. If the cookie name differs in production because of secure cookie naming, document it in the commit message body and adjust the cookie name using NextAuth's secure-cookie convention.

- [ ] **Step 4: Commit login route migration**

Run:

```bash
git add src/app/api/auth/send-login/route.ts src/app/api/auth/callback/email/route.ts
git commit -m "feat: migrate magic link routes to Firestore"
```

Expected: commit succeeds.

## Task 9: Remove MongoDB Modules And Update Docs

**Files:**
- Delete: `src/lib/mongodb.ts`
- Delete: `src/lib/mongodb-adapter.ts`
- Delete: `src/models/Category.ts`
- Delete: `src/models/Product.ts`
- Delete or modify: `src/lib/mongo-error.ts`
- Modify: `README.md`

- [ ] **Step 1: Confirm no MongoDB imports remain**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors from MongoDB imports. If errors mention `mongodb`, `mongoose`, `Category`, `Product`, `clientPromise`, or `connectDB`, remove the stale import and use the Firestore helper already created in earlier tasks.

- [ ] **Step 2: Delete MongoDB modules**

Delete these files:

```text
src/lib/mongodb.ts
src/lib/mongodb-adapter.ts
src/models/Category.ts
src/models/Product.ts
```

If `src/lib/mongo-error.ts` has no imports, delete it. If a route still imports it, replace that route's error response with a fixed Portuguese message before deleting the file.

- [ ] **Step 3: Update README technology and prerequisites**

In `README.md`, replace:

```md
- [MongoDB](https://www.mongodb.com/) com Mongoose - Banco de dados
```

With:

```md
- [Firebase Firestore](https://firebase.google.com/products/firestore) - Banco de dados
```

Replace:

```md
- MongoDB
- Variáveis de ambiente configuradas (veja `.env.example`)
```

With:

```md
- Projeto Firebase com Firestore
- Firebase Emulator Suite para desenvolvimento local
- Variáveis de ambiente configuradas em `.env.local`
```

Replace the project structure line:

```md
  ├── models/      # Modelos do Mongoose
```

With:

```md
  ├── lib/         # Firebase, autenticação e utilitários de servidor
```

- [ ] **Step 4: Run repository-wide MongoDB search**

Run:

```bash
rg "mongodb|mongoose|MongoDB|MONGODB|clientPromise|connectDB|@auth/mongodb-adapter" .
```

Expected: matches only in historical docs such as `MONGODB_FIX.md` or migration specs. No application code should match.

- [ ] **Step 5: Commit Mongo cleanup and docs**

Run:

```bash
git add README.md src/lib src/models
git commit -m "chore: remove MongoDB persistence modules"
```

Expected: commit succeeds.

## Task 10: Emulator And Environment Notes

**Files:**
- Create or modify: `firebase.json`
- Create or modify: `.firebaserc`
- Modify: `README.md`

- [ ] **Step 1: Add Firebase emulator configuration**

Create `firebase.json` if it does not exist:

```json
{
  "emulators": {
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

Create `.firebaserc` if it does not exist:

```json
{
  "projects": {
    "default": "easy-list-local"
  }
}
```

- [ ] **Step 2: Add Firebase env notes to README**

Add this section to `README.md` after the environment setup instructions:

```md
## Firebase e Firestore

O app usa Firebase Admin SDK no servidor e Firestore como banco de dados.

Variáveis esperadas em `.env.local`:

```bash
AUTH_FIREBASE_PROJECT_ID=easy-list-local
AUTH_FIREBASE_CLIENT_EMAIL=
AUTH_FIREBASE_PRIVATE_KEY=
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
RESEND_API_KEY=
EMAIL_FROM=
NEXTAUTH_URL=http://localhost:3000
```

Para desenvolvimento local com emulador:

```bash
npx firebase emulators:start --only firestore
npm run dev
```

Resend continua responsável pelo envio dos emails de login. O emulador cobre o Firestore, não o envio de email.
```

- [ ] **Step 3: Commit emulator docs**

Run:

```bash
git add firebase.json .firebaserc README.md
git commit -m "docs: add Firebase emulator setup"
```

Expected: commit succeeds.

## Task 11: Full Verification

**Files:**
- No planned file edits. Fix only files that fail verification.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: no ESLint warnings or errors.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js production build completes successfully.

- [ ] **Step 4: Manual smoke test with Firestore emulator**

Run in one terminal:

```bash
npx firebase emulators:start --only firestore
```

Run in another terminal:

```bash
npm run dev
```

Verify in the browser:

```text
1. Google login reaches `/`.
2. Magic link email is sent by Resend and redirects to `/` after click.
3. Verification-code email is sent by Resend and logs in through the code flow.
4. First login creates `Supermercado` automatically.
5. Creating, listing, and deleting a category works.
6. Deleting a category removes its products.
7. Creating, editing, moving, toggling cart, and deleting a product works.
8. A second user cannot see or modify the first user's categories/products.
```

- [ ] **Step 5: Commit verification fixes if any were needed**

If verification required code changes, run:

```bash
git add <changed-files>
git commit -m "fix: resolve Firebase migration verification issues"
```

Expected: commit succeeds. If no changes were needed, do not create an empty commit.

## Self-Review

- Spec coverage: dependencies, Firebase Admin, Firestore domain data, NextAuth adapter, Resend preservation, auth code routes, magic link callback, emulator setup, Mongo cleanup, and verification are all mapped to tasks.
- Red-flag scan: this plan intentionally avoids undefined follow-up work. Each code-changing step includes exact code or exact replacement snippets.
- Type consistency: helper names used by route tasks match the helper exports defined in earlier tasks.
