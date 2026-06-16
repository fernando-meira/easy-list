import 'server-only';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

import type { ProductProps, CategoryProps } from '@/types/interfaces';

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
    subcategoryOrder: data.subcategoryOrder as string[] | undefined,
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
    category,
    _id: doc.id,
    name: data.name,
    unit: data.unit,
    price: data.price,
    barcode: data.barcode,
    quantity: data.quantity,
    categoryId: data.categoryId,
    subcategory: data.subcategory,
    addToCart: Boolean(data.addToCart),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

async function getOwnedCategory(categoryId: string, userId: string) {
  const categoryDoc = await categoriesCollection.doc(categoryId).get();

  if (!categoryDoc.exists || categoryDoc.data()?.userId !== userId) {
    return null;
  }

  return categoryFromDoc(categoryDoc);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getOwnedProductDoc(productId: string, userId: string) {
  const productDoc = await productsCollection.doc(productId).get();

  if (!productDoc.exists || productDoc.data()?.userId !== userId) {
    return null;
  }

  return productDoc;
}

interface AccessibleCategoryResult {
  category: CategoryProps;
  ownerUserId: string;
}

async function getAccessibleCategory(
  categoryId: string,
  userId: string
): Promise<AccessibleCategoryResult | null> {
  const categoryDoc = await categoriesCollection.doc(categoryId).get();

  if (!categoryDoc.exists) return null;

  const data = categoryDoc.data()!;
  const isOwner = data.userId === userId;
  const isSharedWith =
    Array.isArray(data.sharedWith) && data.sharedWith.includes(userId);

  if (!isOwner && !isSharedWith) return null;

  return {
    category: categoryFromDoc(categoryDoc),
    ownerUserId: data.userId as string,
  };
}

async function getAccessibleProductDoc(productId: string, userId: string) {
  const productDoc = await productsCollection.doc(productId).get();

  if (!productDoc.exists) return null;

  const data = productDoc.data()!;

  if (data.userId === userId) return productDoc;

  const result = await getAccessibleCategory(data.categoryId as string, userId);

  if (!result) return null;

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
  const result = await getAccessibleCategory(categoryId, userId);

  if (!result) return null;

  const { category, ownerUserId } = result;

  const productsSnapshot = await productsCollection
    .where('userId', '==', ownerUserId)
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

export async function updateCategory(userId: string, categoryId: string, name: string) {
  const category = await getOwnedCategory(categoryId, userId);

  if (!category) {
    return null;
  }

  await categoriesCollection.doc(categoryId).update({
    name,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await categoriesCollection.doc(categoryId).get();

  return categoryFromDoc(updated);
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
  const result = await getAccessibleCategory(product.categoryId, userId);

  if (!result) return null;

  const { category, ownerUserId } = result;

  const productRef = productsCollection.doc();

  await productRef.set({
    name: product.name,
    userId: ownerUserId,
    unit: product.unit ?? null,
    price: product.price ?? null,
    categoryId: product.categoryId,
    barcode: product.barcode ?? null,
    quantity: product.quantity ?? null,
    subcategory: product.subcategory ?? null,
    addToCart: Boolean(product.addToCart),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const productDoc = await productRef.get();

  return productFromDoc(productDoc, category);
}

export async function getProduct(userId: string, productId: string) {
  const productDoc = await getAccessibleProductDoc(productId, userId);

  if (!productDoc) return null;

  const data = productDoc.data()!;
  const result = await getAccessibleCategory(data.categoryId as string, userId);

  if (!result) return null;

  return productFromDoc(productDoc, result.category);
}

export async function updateProduct(userId: string, productId: string, product: ProductWrite) {
  const productDoc = await getAccessibleProductDoc(productId, userId);

  if (!productDoc) return null;

  const result = await getAccessibleCategory(product.categoryId, userId);

  if (!result) return null;

  const { category } = result;

  await productsCollection.doc(productId).update({
    name: product.name,
    unit: product.unit ?? null,
    price: product.price ?? null,
    categoryId: product.categoryId,
    barcode: product.barcode ?? null,
    quantity: product.quantity ?? null,
    addToCart: Boolean(product.addToCart),
    updatedAt: FieldValue.serverTimestamp(),
    subcategory: product.subcategory ?? null,
  });

  const updatedProductDoc = await productsCollection.doc(productId).get();

  return productFromDoc(updatedProductDoc, category);
}

export async function deleteProduct(userId: string, productId: string) {
  const productDoc = await getAccessibleProductDoc(productId, userId);

  if (!productDoc) return false;

  await productDoc.ref.delete();

  return true;
}

export async function generateShareToken(userId: string, categoryId: string): Promise<string | null> {
  const categoryDoc = await categoriesCollection.doc(categoryId).get();

  if (!categoryDoc.exists || categoryDoc.data()?.userId !== userId) {
    return null;
  }

  const existing = categoryDoc.data()?.shareToken as string | undefined;

  if (existing) return existing;

  const token = crypto.randomUUID();

  await categoriesCollection.doc(categoryId).update({ shareToken: token });

  return token;
}

export async function joinSharedList(
  token: string,
  requestingUserId: string
): Promise<{ categoryId: string; categoryName: string } | null> {
  const snapshot = await categoriesCollection
    .where('shareToken', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const categoryDoc = snapshot.docs[0];

  if (categoryDoc.data().userId !== requestingUserId) {
    await categoriesCollection
      .doc(categoryDoc.id)
      .update({ sharedWith: FieldValue.arrayUnion(requestingUserId) });
  }

  return {
    categoryId: categoryDoc.id,
    categoryName: categoryDoc.data().name as string,
  };
}

export async function lookupShareToken(token: string): Promise<{ categoryName: string } | null> {
  const snapshot = await categoriesCollection
    .where('shareToken', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  return { categoryName: snapshot.docs[0].data().name as string };
}

export async function getUserHistoryForAI(
  userId: string
): Promise<{ name: string; products: string[] }[]> {
  const categoriesSnapshot = await categoriesCollection
    .where('userId', '==', userId)
    .limit(5)
    .get();

  if (categoriesSnapshot.empty) return [];

  const result: { name: string; products: string[] }[] = [];

  for (const categoryDoc of categoriesSnapshot.docs) {
    const productsSnapshot = await productsCollection
      .where('userId', '==', userId)
      .where('categoryId', '==', categoryDoc.id)
      .limit(5)
      .get();

    result.push({
      name: categoryDoc.data().name as string,
      products: productsSnapshot.docs.map((doc) => doc.data().name as string),
    });
  }

  return result;
}

export type OrganizeProduct = { id: string; subcategory: string };

export async function getProductsForOrganize(
  userId: string,
  categoryId: string
): Promise<{ id: string; name: string }[] | null> {
  const category = await getOwnedCategory(categoryId, userId);
  if (!category) return null;

  const snapshot = await productsCollection
    .where('userId', '==', userId)
    .where('categoryId', '==', categoryId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name as string,
  }));
}

export async function organizeList(
  userId: string,
  categoryId: string,
  subcategoryOrder: string[],
  productClassifications: OrganizeProduct[]
): Promise<boolean> {
  const category = await getOwnedCategory(categoryId, userId);
  if (!category) return false;

  const batch = firestore.batch();

  for (const { id, subcategory } of productClassifications) {
    batch.update(productsCollection.doc(id), {
      subcategory,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  batch.update(categoriesCollection.doc(categoryId), {
    subcategoryOrder,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return true;
}

export async function removeGrouping(userId: string, categoryId: string): Promise<boolean> {
  const category = await getOwnedCategory(categoryId, userId);
  if (!category) return false;

  await categoriesCollection.doc(categoryId).update({
    subcategoryOrder: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return true;
}
