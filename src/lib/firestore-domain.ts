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
    price: product.price ?? null,
    quantity: product.quantity ?? null,
    unit: product.unit ?? null,
    categoryId: product.categoryId,
    userId: ownerUserId,
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
  const productDoc = await getAccessibleProductDoc(productId, userId);

  if (!productDoc) return false;

  await productDoc.ref.delete();

  return true;
}
