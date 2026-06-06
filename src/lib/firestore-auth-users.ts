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
